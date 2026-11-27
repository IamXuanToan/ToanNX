"""Kiểm thử QStash Dispatch Due: POST /api/v1/workspace/cron/dispatch-due."""

from datetime import timedelta
from typing import Any
from unittest.mock import patch

import pytest
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.core.tests.helpers.fake_redis import FakeRedis
from app.system.constants.notification_channel import NotificationChannel
from app.system.models.notification import Notification
from app.system.models.notification_delivery import NotificationDelivery
from app.system.models.notification_preference import NotificationPreference
from app.system.models.telegram_chat import TelegramChat
from app.system.services.notification_preference_service import NotificationPreferenceService
from app.system.tests.helpers.permission_helper import grant
from app.workspace.constants.workspace_notification_event import WorkspaceNotificationEvent
from app.workspace.models.asset import Asset
from app.workspace.models.reminder import Reminder
from app.workspace.models.subscription import Subscription
from app.workspace.permissions.asset_permission import AssetPermission
from app.workspace.permissions.reminder_permission import ReminderPermission
from app.workspace.permissions.subscription_permission import SubscriptionPermission
from app.workspace.permissions.workspace_dashboard_permission import WorkspaceDashboardPermission
from app.workspace.services.assistant_config_service import AssistantConfigService
from app.workspace.services.reminder_service import ReminderService
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
        grant(user, ReminderPermission.READ, WorkspaceDashboardPermission.READ)

        tz_svc = WorkspaceTimezoneService()
        now = timezone.now()
        local_now = tz_svc.local_now("Asia/Ho_Chi_Minh", now=now)
        slot_str = local_now.strftime("%H:%M")

        AssistantConfigService().update_config(
            user,
            {
                "digest_time_slots": [slot_str],
                "digest_sections": ["reminders", "warranty", "finance"],
            },
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
        rem_notif = Notification.objects.get(recipient=user, event_code="workspace.reminder.due")
        digest_notif = Notification.objects.get(recipient=user, event_code="workspace.digest.daily")
        assert rem_notif.link == "/portal/reminders"
        assert digest_notif.link == "/portal"

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

    def test_rescheduled_reminder_and_digest_grace_window(
        self,
        user: Any,
        client: Any,
        settings: Any,
        fake_redis: FakeRedis,
        django_capture_on_commit_callbacks: Any,
    ) -> None:
        """Đổi giờ nhắc trong cùng ngày vẫn gửi thông báo mới và slot Digest trong 30p không bị rớt."""
        settings.CRON_SECRET = "cron-dispatch-secret"  # noqa: S105 - giá trị test
        grant(
            user,
            ReminderPermission.READ,
            ReminderPermission.UPDATE,
            WorkspaceDashboardPermission.READ,
        )

        tz_svc = WorkspaceTimezoneService()
        now = timezone.now()
        local_now = tz_svc.local_now("Asia/Ho_Chi_Minh", now=now)
        slot_20m_ago = (local_now - timedelta(minutes=20)).strftime("%H:%M")
        # Nếu -20p lùi sang hôm qua vẫn hợp lệ nhờ offset (-1, 0) & grace 1800s!
        AssistantConfigService().update_config(
            user,
            {
                "digest_time_slots": [slot_20m_ago],
                "digest_sections": ["reminders"],
            },
        )
        due_1 = (local_now - timedelta(minutes=10)).time().replace(second=0, microsecond=0)
        rem = Reminder.objects.create(
            owner=user,
            title="Dời giờ cùng ngày",
            due_date=local_now.date(),
            due_time=due_1,
        )

        # Kiểm tra compute_next_due_epoch giữ nguyên slot digest -20 phút (trong cửa sổ 1800s)
        cache_svc = WorkspaceAlertsCacheService()
        next_due = cache_svc.compute_next_due_epoch(now=now)
        assert next_due is not None and next_due <= int(now.timestamp())

        res1 = client.post(URL, HTTP_AUTHORIZATION="Bearer cron-dispatch-secret")
        assert self.assert_success(res1)["notifications_queued"] == 2

        # Dời giờ qua ReminderService để hook on_commit tính lại alerts_next_due và gửi lại trong cùng ngày.
        due_2 = (local_now - timedelta(minutes=1)).time().replace(second=0, microsecond=0)
        payload: dict[str, Any] = {"notify_minutes_before": 1} if due_2 == due_1 else {"due_time": due_2}
        with django_capture_on_commit_callbacks(execute=True):
            ReminderService().update(user, rem.pk, payload)

        res2 = client.post(URL, HTTP_AUTHORIZATION="Bearer cron-dispatch-secret")
        assert self.assert_success(res2)["notifications_queued"] == 1
        assert Notification.objects.filter(recipient=user, event_code="workspace.reminder.due").count() == 2

    def test_profile_notification_preferences_dispatch_for_reminder_asset_subscription(
        self, user: Any, client: Any, settings: Any, vnd: Any, fake_redis: FakeRedis
    ) -> None:
        """Nhắc việc, bảo hành & gia hạn tuân theo cấu hình kênh trong Hồ sơ → Thông báo."""
        settings.CRON_SECRET = "cron-dispatch-secret"  # noqa: S105 - giá trị test
        settings.TELEGRAM_BOT_TOKEN = "123:TG-BOT"  # noqa: S105 - giá trị test
        grant(user, ReminderPermission.READ, AssetPermission.READ, SubscriptionPermission.READ)

        chat = TelegramChat.objects.create(
            owner=user,
            chat_id="900100",
            chat_type="private",
            title="Private",
            status=TelegramChat.Status.ACTIVE,
            is_active=True,
        )
        NotificationPreferenceService().update(
            user,
            [
                {
                    "event_code": WorkspaceNotificationEvent.REMINDER_DUE,
                    "in_app": False,
                    "push": False,
                    "email": True,
                    "telegram_chat_ids": [str(chat.pk)],
                },
                {
                    "event_code": WorkspaceNotificationEvent.WARRANTY_EXPIRING,
                    "in_app": True,
                    "push": False,
                    "email": True,
                    "telegram_chat_ids": [],
                },
                {
                    "event_code": WorkspaceNotificationEvent.SUBSCRIPTION_RENEWING,
                    "in_app": False,
                    "push": False,
                    "email": False,
                    "telegram_chat_ids": [str(chat.pk)],
                },
            ],
        )
        now = timezone.now()
        local_now = WorkspaceTimezoneService().local_now("Asia/Ho_Chi_Minh", now=now)
        today = local_now.date()
        due_time = (local_now - timedelta(minutes=2)).time().replace(second=0, microsecond=0)
        safe_time = due_time if due_time <= local_now.time() else local_now.time()

        # Nhắc việc theo tùy chọn Hồ sơ: tắt IN_APP, bật TELEGRAM + EMAIL
        Reminder.objects.create(
            owner=user,
            title="Nhắc qua Telegram & Email",
            due_date=today,
            due_time=safe_time,
        )
        # Thiết bị hết bảo hành trong 7 ngày: bật IN_APP + EMAIL
        Asset.objects.create(
            owner=user,
            name="Monitor Dell",
            purchase_date=today - timedelta(days=358),
            warranty_end_date=today + timedelta(days=7),
            currency=vnd,
        )
        # Dịch vụ sắp gia hạn trong 3 ngày: chỉ bật TELEGRAM
        Subscription.objects.create(
            owner=user,
            name="Cloud Pro",
            currency=vnd,
            renew_date=today + timedelta(days=3),
            reminder_days_before=[3],
        )

        with patch("app.system.services.notification_service.NotificationService.flush_kick"):
            res = client.post(URL, HTTP_AUTHORIZATION="Bearer cron-dispatch-secret")
        assert self.assert_success(res)["notifications_queued"] == 3

        rem_notif = Notification.objects.get(recipient=user, event_code="workspace.reminder.due")
        assert rem_notif.expires_at is not None  # Tắt IN_APP trong Hồ sơ → không giữ trên chuông web
        rem_channels = set(
            NotificationDelivery.objects.filter(notification=rem_notif).values_list("channel", flat=True)
        )
        assert rem_channels == {NotificationChannel.TELEGRAM, NotificationChannel.EMAIL}

        war_notif = Notification.objects.get(recipient=user, event_code="workspace.warranty.expiring")
        assert war_notif.expires_at is None  # Bật IN_APP trong Hồ sơ
        war_channels = set(
            NotificationDelivery.objects.filter(notification=war_notif).values_list("channel", flat=True)
        )
        assert war_channels == {NotificationChannel.EMAIL}

        sub_notif = Notification.objects.get(recipient=user, event_code="workspace.subscription.renewing")
        assert sub_notif.expires_at is not None  # Tắt IN_APP trong Hồ sơ
        sub_channels = set(
            NotificationDelivery.objects.filter(notification=sub_notif).values_list("channel", flat=True)
        )
        assert sub_channels == {NotificationChannel.TELEGRAM}

    def test_profile_email_preference_triggers_email_for_reminder_with_default_website_channel(
        self, user: Any, client: Any, settings: Any, fake_redis: Any
    ) -> None:
        """Tích Email/Telegram ở Hồ sơ vẫn gửi đúng dù nhắc việc mặc định WEBSITE."""
        settings.CRON_SECRET = "cron-dispatch-secret"  # noqa: S105 - giá trị test
        settings.TELEGRAM_BOT_TOKEN = "123:TG-BOT"  # noqa: S105 - giá trị test
        grant(user, ReminderPermission.READ)

        tg_chat = TelegramChat.objects.create(
            owner=user,
            chat_id="900200",
            chat_type="private",
            title="Private",
            status=TelegramChat.Status.ACTIVE,
            is_active=True,
        )
        NotificationPreference.objects.create(
            user=user,
            event_code="workspace.reminder.due",
            channel=NotificationChannel.EMAIL,
            is_enabled=True,
        )
        NotificationPreference.objects.create(
            user=user,
            event_code="workspace.reminder.due",
            channel=NotificationChannel.TELEGRAM,
            telegram_chat_id=str(tg_chat.pk),
            is_enabled=True,
        )

        now = timezone.now()
        local_now = WorkspaceTimezoneService().local_now("Asia/Ho_Chi_Minh", now=now)
        due_time = (local_now - timedelta(minutes=2)).time().replace(second=0, microsecond=0)
        safe_time = due_time if due_time <= local_now.time() else local_now.time()

        Reminder.objects.create(
            owner=user,
            title="Nhắc việc mặc định WEBSITE nhưng Hồ sơ bật Email & Telegram",
            due_date=local_now.date(),
            due_time=safe_time,
        )

        with patch("app.system.services.notification_service.NotificationService.flush_kick"):
            res = client.post(URL, HTTP_AUTHORIZATION="Bearer cron-dispatch-secret")
        assert self.assert_success(res)["notifications_queued"] == 1

        rem_notif = Notification.objects.get(recipient=user, event_code="workspace.reminder.due")
        assert rem_notif.expires_at is None
        deliveries = list(NotificationDelivery.objects.filter(notification=rem_notif))
        assert {(d.channel, d.target) for d in deliveries} == {
            (NotificationChannel.EMAIL, user.email),
            (NotificationChannel.TELEGRAM, str(tg_chat.pk)),
        }
        assert len(deliveries) == 2
