"""Kiểm thử Cron Tick Serverless: POST /api/v1/workspace/cron/tick (W4 DB Alerts)."""

from datetime import timedelta
from typing import Any
from unittest.mock import patch

import pytest
from django.db import transaction
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.core.tests.helpers.fake_redis import FakeRedis
from app.system.models.notification import Notification
from app.system.tests.helpers.permission_helper import grant
from app.workspace.constants.workspace_defaults import (
    ALERTS_NEXT_DUE_TTL_SECONDS,
    REDIS_ALERTS_NEXT_DUE_KEY,
)
from app.workspace.models.reminder import Reminder
from app.workspace.permissions.reminder_permission import ReminderPermission
from app.workspace.services.reminder_service import ReminderService
from app.workspace.services.workspace_alerts_cache_service import WorkspaceAlertsCacheService
from app.workspace.services.workspace_cron_service import WorkspaceCronService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/cron/tick"


class TestCronTickApi(BaseApiTestCase):
    """Kiểm thử auth 404, 0-query khi Redis W4 chưa tới hạn, lock atomic W4 và re-warm cache."""

    def test_cron_auth_404_and_zero_db_alerts_when_w4_not_due(
        self, client: Any, settings: Any, fake_redis: Any, django_assert_num_queries: Any
    ) -> None:
        settings.CRON_SECRET = "super-cron-secret"  # noqa: S105 - giá trị giả cho test
        assert client.post(URL).status_code == 404
        assert client.post(URL, HTTP_AUTHORIZATION="Bearer wrong").status_code == 404

        WorkspaceAlertsCacheService().write_alerts_next_due(int(timezone.now().timestamp()) + 3600)

        # W4 chưa tới hạn → service chạy ĐÚNG 0 SQL QUERY!
        with django_assert_num_queries(0):
            service_res = WorkspaceCronService().run_tick()
        assert service_res["w4_ran"] is False
        assert service_res["w4_db_touched"] is False

        res = client.post(URL, HTTP_AUTHORIZATION="Bearer super-cron-secret")
        data = self.assert_success(res)
        assert data["w4_ran"] is False

    def test_idle_workspace_does_not_schedule_qstash_loop_or_touch_db_on_tick(
        self, fake_redis: FakeRedis, django_assert_num_queries: Any
    ) -> None:
        """Hệ thống rảnh không tạo QStash tự lặp 24h; các lượt /tick sau tốn 0 SQL cho W4."""
        with patch("app.system.services.qstash_client.QstashClient.publish") as mock_pub:
            next_due = WorkspaceAlertsCacheService().refresh_alerts_next_due()
        assert mock_pub.call_count == 0
        assert next_due > int(timezone.now().timestamp()) + 6 * 86400

        with django_assert_num_queries(0):
            tick = WorkspaceCronService().run_tick(run_w4=True)
        assert tick["w4_ran"] is False
        assert tick["w4_db_touched"] is False

    def test_qstash_fallback_fires_w4_on_tick_when_due(self, user: Any, fake_redis: FakeRedis) -> None:
        """Khi QStash tắt hoặc lỗi, alerts_next_due <= now vẫn giúp /tick kích hoạt fallback W4."""
        grant(user, ReminderPermission.READ)
        now = timezone.now()
        local_now = WorkspaceTimezoneService().local_now("Asia/Ho_Chi_Minh", now=now)
        due_time = (local_now - timedelta(minutes=2)).time().replace(second=0, microsecond=0)
        Reminder.objects.create(
            owner=user,
            title="Fallback tick",
            due_date=local_now.date(),
            due_time=due_time if due_time <= local_now.time() else local_now.time(),
            is_completed=False,
        )
        with patch("app.system.services.qstash_client.QstashClient.is_configured", return_value=False):
            WorkspaceAlertsCacheService().refresh_alerts_next_due(now=now)
        tick = WorkspaceCronService().run_tick(run_w4=True)
        assert tick["w4_ran"] is True
        assert tick["notifications_queued"] == 1

        # Chạy lại /tick sau khi đã xử lý -> reminder được đánh dấu tránh lặp 15p/lần!
        tick2 = WorkspaceCronService().run_tick(run_w4=True)
        assert tick2["w4_ran"] is False
        assert tick2["notifications_queued"] == 0

    def test_redis_24h_ttl_loss_rewarms_via_tick_and_daily_cleanup(
        self, user: Any, fake_redis: FakeRedis, django_assert_num_queries: Any
    ) -> None:
        """Redis lưu TTL 24h; mất khóa giữa chừng hoặc cleanup 03:00 UTC tự đồng bộ lại cache & QStash."""
        assert ALERTS_NEXT_DUE_TTL_SECONDS == 86400
        grant(user, ReminderPermission.READ)
        now = timezone.now()
        target_local = WorkspaceTimezoneService().local_now(
            "Asia/Ho_Chi_Minh", now=now + timedelta(minutes=30)
        )
        Reminder.objects.create(
            owner=user,
            title="Hẹn tương lai gần",
            due_date=target_local.date(),
            due_time=target_local.time().replace(second=0, microsecond=0),
        )
        with (
            patch("app.system.services.qstash_client.QstashClient.is_configured", return_value=True),
            patch("app.system.services.qstash_client.QstashClient.publish") as mock_pub,
        ):
            synced = WorkspaceCronService().refresh_cron_schedules()
        assert synced >= 1
        assert mock_pub.call_count >= 1
        assert fake_redis.get(REDIS_ALERTS_NEXT_DUE_KEY) is not None

        # Mô phỏng Redis chết / mất khóa giữa chừng → tick kế tiếp re-warm ngay không bỏ sót
        fake_redis.delete(REDIS_ALERTS_NEXT_DUE_KEY)
        tick = WorkspaceCronService().run_tick(run_w4=True)
        assert tick["w4_db_touched"] is True
        assert WorkspaceAlertsCacheService().read_alerts_next_due() is not None

        # Quét lại lúc chưa tới hạn -> 0 query
        with django_assert_num_queries(0):
            tick_idle = WorkspaceCronService().run_tick(run_w4=True)
        assert tick_idle["w4_db_touched"] is False

    def test_bulk_commit_deduplicates_alerts_refresh_and_ignores_ancient_reminders(
        self, user: Any, fake_redis: FakeRedis
    ) -> None:
        """Gộp refresh on_commit trong bulk transaction và không quét lại reminder quá hạn nhiều ngày."""
        grant(user, ReminderPermission.READ)
        Reminder.objects.create(
            owner=user,
            title="Việc quá cũ",
            due_date=(timezone.now() - timedelta(days=10)).date(),
            is_completed=False,
        )
        tick = WorkspaceCronService().run_tick(run_w4=True, force_w4=True)
        assert tick["notifications_queued"] == 0
        assert Notification.objects.filter(recipient=user).count() == 0

        service = ReminderService()
        reminders = [
            Reminder.objects.create(
                owner=user,
                title=f"Bulk {idx}",
                due_date=(timezone.now() + timedelta(days=2)).date(),
            )
            for idx in range(3)
        ]
        with patch(
            "app.workspace.services.workspace_alerts_cache_service.WorkspaceAlertsCacheService.refresh_alerts_next_due",
            return_value=int(timezone.now().timestamp()) + 3600,
        ) as mock_refresh:
            with transaction.atomic():
                for rem in reminders:
                    service.delete(user, rem.pk)
            conn = transaction.get_connection()
            matched = [
                entry[1]
                for entry in conn.run_on_commit
                if getattr(entry[1], "_ws_on_commit_key", None) == "ws:refresh_alerts_next_due"
            ]
            assert len(matched) == 1
        assert mock_refresh.call_count == 0
