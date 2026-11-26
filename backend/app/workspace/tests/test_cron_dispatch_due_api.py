"""Kiểm thử QStash Dispatch Due: POST /api/v1/workspace/cron/dispatch-due."""

from datetime import timedelta
from typing import Any
from unittest.mock import patch

import pytest
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.core.tests.helpers.fake_redis import FakeRedis
from app.system.models.notification import Notification
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.reminder import Reminder
from app.workspace.models.workspace_setting import WorkspaceSetting
from app.workspace.permissions.reminder_permission import ReminderPermission
from app.workspace.permissions.workspace_setting_permission import WorkspaceSettingPermission
from app.workspace.services.workspace_alerts_cache_service import WorkspaceAlertsCacheService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/cron/dispatch-due"


class TestCronDispatchDueApi(BaseApiTestCase):
    """Kiểm thử QStash verify, `notify(kick=False)` + `1x flush_kick()`, dedup Digest & bỏ nhắc việc xong."""

    def test_dispatch_due_notifies_pending_and_digest_with_single_kick(
        self, user: Any, client: Any, settings: Any, fake_redis: Any
    ) -> None:
        settings.CRON_SECRET = "cron-dispatch-secret"  # noqa: S105 - giá trị test
        assert client.post(URL).status_code == 404
        grant(user, ReminderPermission.READ, WorkspaceSettingPermission.READ)

        tz_svc = WorkspaceTimezoneService()
        now = timezone.now()
        local_now = tz_svc.local_now("Asia/Ho_Chi_Minh", now=now)
        slot_str = local_now.strftime("%H:%M")

        WorkspaceSetting.objects.create(
            owner=user,
            timezone="Asia/Ho_Chi_Minh",
            daily_digest_enabled=True,
            digest_time_slots=[slot_str],
            digest_sections=["reminders", "monitors", "finance"],
        )
        due_time = (local_now - timedelta(minutes=2)).time().replace(second=0, microsecond=0)
        # Chỉ khi còn chưa sang ngày trước thì mới dùng đúng local_now.date()
        due_date = local_now.date()
        Reminder.objects.create(
            owner=user,
            title="Việc tới giờ",
            due_date=due_date,
            due_time=due_time if due_time <= local_now.time() else local_now.time(),
            is_completed=False,
        )
        Reminder.objects.create(
            owner=user,
            title="Việc đã làm rồi",
            due_date=due_date,
            due_time=local_now.time(),
            is_completed=True,
        )

        with patch("app.system.services.notification_service.NotificationService.flush_kick") as flush_kick:
            res = client.post(URL, HTTP_AUTHORIZATION="Bearer cron-dispatch-secret")
        data = self.assert_success(res)
        assert data["w4_ran"] is True
        assert data["notifications_queued"] == 2  # 1 Reminder + 1 Digest (không tính việc đã xong)
        assert data["kicked"] is True
        assert flush_kick.call_count == 1
        assert Notification.objects.filter(recipient=user, event_code="workspace.reminder.due").count() == 1
        assert Notification.objects.filter(recipient=user, event_code="workspace.digest.daily").count() == 1

        # Gọi lại ngay lần 2 cùng slot → digest_sent atomic lock + DB dedup ngăn gửi trùng!
        res2 = client.post(URL, HTTP_AUTHORIZATION="Bearer cron-dispatch-secret")
        data2 = self.assert_success(res2)
        assert data2["notifications_queued"] == 0
        assert Notification.objects.filter(recipient=user).count() == 2

    def test_qstash_signature_verification(self, client: Any) -> None:
        # Chữ ký sai trả 404
        assert client.post(URL, HTTP_UPSTASH_SIGNATURE="invalid-jwt").status_code == 404
        with patch("app.system.services.qstash_client.QstashClient.verify", return_value=True):
            res = client.post(URL, HTTP_UPSTASH_SIGNATURE="valid-mock-jwt")
            assert self.assert_success(res)["w4_ran"] is True

    def test_stale_qstash_dispatch_skips_db_when_alerts_next_due_in_future(
        self, client: Any, fake_redis: FakeRedis, django_assert_num_queries: Any
    ) -> None:
        """Lượt QStash cũ sau khi nhắc việc đã bị hủy hoặc dời xa sẽ bỏ qua quét DB."""
        WorkspaceAlertsCacheService().write_alerts_next_due(int(timezone.now().timestamp()) + 3600)
        with (
            patch("app.system.services.qstash_client.QstashClient.verify", return_value=True),
            django_assert_num_queries(0),
        ):
            res = client.post(URL, HTTP_UPSTASH_SIGNATURE="valid-mock-jwt")
        data = self.assert_success(res)
        assert data["w4_ran"] is False
        assert data["w4_db_touched"] is False
