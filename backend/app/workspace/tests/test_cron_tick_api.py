"""Kiểm thử Cron Tick Serverless: POST /api/v1/workspace/cron/tick (W1 Monitor != W4 DB Alerts)."""

from datetime import timedelta
from typing import Any
from unittest.mock import patch

import pytest
from django.utils import timezone

from app.core.cache.cache_service import CacheService
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.core.tests.helpers.fake_redis import FakeRedis
from app.workspace.constants.workspace_defaults import REDIS_W1_LOCK_KEY
from app.workspace.models.monitor_target import MonitorTarget
from app.workspace.services.workspace_alerts_cache_service import WorkspaceAlertsCacheService
from app.workspace.services.workspace_cron_service import WorkspaceCronService

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/cron/tick"


class TestCronTickApi(BaseApiTestCase):
    """Kiểm thử auth 404, 0-query khi Redis W4 chưa tới hạn, lock atomic W1/W4 và re-warm cache."""

    def test_cron_auth_404_and_zero_db_alerts_when_w1_healthy(
        self, user: Any, client: Any, settings: Any, fake_redis: Any, django_assert_num_queries: Any
    ) -> None:
        settings.CRON_SECRET = "super-cron-secret"  # noqa: S105 - giá trị giả cho test
        assert client.post(URL).status_code == 404
        assert client.post(URL, HTTP_AUTHORIZATION="Bearer wrong").status_code == 404

        target = MonitorTarget.objects.create(
            owner=user,
            name="Fast Ping",
            url="https://example.com",
            last_status=MonitorTarget.Status.HEALTHY,
            last_checked_at=timezone.now() - timedelta(minutes=35),
        )
        cache_svc = WorkspaceAlertsCacheService()
        cache_svc.sync_monitors_active()
        cache_svc.write_alerts_next_due(int(timezone.now().timestamp()) + 3600)

        # W1 ping thành công (HEALTHY giữ nguyên) & W4 chưa tới hạn → service chạy ĐÚNG 0 SQL QUERY!
        with patch(
            "app.core.utils.safe_http_client.SafeHttpClient.probe",
            return_value={
                "ok": True,
                "status_code": 200,
                "latency_ms": 20,
                "final_url": target.url,
                "error_message": "",
            },
        ):
            with django_assert_num_queries(0):
                service_res = WorkspaceCronService().run_tick()
            assert service_res["w1_checked"] == 1
            assert service_res["w1_db_touched"] is False
            assert service_res["w4_ran"] is False
            assert service_res["w4_db_touched"] is False

        # Endpoint POST cũng chạy bình thường với Bearer secret (bên ngoài HTTP còn query RateLimitBucket).
        with patch(
            "app.core.utils.safe_http_client.SafeHttpClient.probe",
            return_value={
                "ok": True,
                "status_code": 200,
                "latency_ms": 15,
                "final_url": target.url,
                "error_message": "",
            },
        ):
            res = client.post(URL, HTTP_AUTHORIZATION="Bearer super-cron-secret")
        data = self.assert_success(res)
        assert data["w4_ran"] is False

    def test_w1_lock_skips_concurrent_run_and_cache_miss_rewarms(self, user: Any, fake_redis: Any) -> None:
        MonitorTarget.objects.create(owner=user, name="M1", url="https://example.com")
        CacheService().set_if_absent(REDIS_W1_LOCK_KEY, "1", 30)
        res_locked = WorkspaceCronService().run_tick(run_w4=False)
        assert res_locked["w1_checked"] == 0

        CacheService().delete(REDIS_W1_LOCK_KEY)
        # Miss cache → tự đọc DB và re-warm lại Redis
        with patch(
            "app.core.utils.safe_http_client.SafeHttpClient.probe",
            return_value={
                "ok": False,
                "status_code": 503,
                "latency_ms": 50,
                "final_url": "https://example.com",
                "error_message": "HTTP 503",
            },
        ):
            res = WorkspaceCronService().run_tick(run_w4=False)
        assert res["w1_checked"] == 1
        assert res["w1_flipped"] == 1
        assert CacheService().get_json("workspace:monitors:active") is not None

    def test_idle_workspace_does_not_schedule_qstash_loop_or_touch_db_on_tick(
        self, fake_redis: FakeRedis, django_assert_num_queries: Any
    ) -> None:
        """Hệ thống rảnh không tạo QStash tự lặp 24h; các lượt /tick sau tốn 0 SQL cho W4."""
        with patch("app.system.services.qstash_client.QstashClient.publish") as mock_pub:
            next_due = WorkspaceAlertsCacheService().refresh_alerts_next_due()
        assert mock_pub.call_count == 0
        assert next_due > int(timezone.now().timestamp()) + 6 * 86400

        with django_assert_num_queries(0):
            tick = WorkspaceCronService().run_tick(run_w1=False, run_w4=True)
        assert tick["w4_ran"] is False
        assert tick["w4_db_touched"] is False

    def test_qstash_fallback_fires_w4_on_tick_when_due(self, user: Any, fake_redis: FakeRedis) -> None:
        """Khi QStash tắt hoặc lỗi, alerts_next_due <= now vẫn giúp /tick kích hoạt fallback W4."""
        from app.system.tests.helpers.permission_helper import grant
        from app.workspace.models.reminder import Reminder
        from app.workspace.permissions.reminder_permission import ReminderPermission
        from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService

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
        tick = WorkspaceCronService().run_tick(run_w1=False, run_w4=True)
        assert tick["w4_ran"] is True
        assert tick["notifications_queued"] == 1

        # Chạy lại /tick sau khi đã xử lý -> reminder được đánh dấu tránh lặp 15p/lần!
        tick2 = WorkspaceCronService().run_tick(run_w1=False, run_w4=True)
        assert tick2["w4_ran"] is False
        assert tick2["notifications_queued"] == 0
