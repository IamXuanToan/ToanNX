"""NotificationService (plan thông báo 15.1–15.3).

Người nhận, kênh, chống trùng, không ảnh hưởng nghiệp vụ, retry.
"""

from typing import Any
from unittest.mock import patch

import pytest
from django.core.exceptions import ImproperlyConfigured
from django.db import transaction

from app.system.models.notification import Notification
from app.system.models.notification_delivery import NotificationDelivery
from app.system.models.notification_preference import NotificationPreference
from app.system.models.push_device import PushDevice
from app.system.services.notification_service import NotificationService
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.system.types.notification_payload import NotificationPayload
from app.system.types.push_send_result import PushSendResult

pytestmark = pytest.mark.django_db
PAYLOAD = NotificationPayload(title="Tiêu đề", body="Nội dung", link="/admin")


@pytest.fixture(autouse=True)
def _firebase(settings: Any) -> None:
    settings.FIREBASE_PROJECT_ID = "test"
    settings.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 = "e30="


def test_owner_event_creates_bell_and_push(user: Any) -> None:
    PushDevice.objects.create(user=user, fcm_token="a")
    PushDevice.objects.create(user=user, fcm_token="b")
    service = NotificationService()
    assert (
        service.notify("system.announcement.published", recipient=user, dedup_key="k", payload=PAYLOAD) == 1
    )
    assert (
        service.notify("system.announcement.published", recipient=user, dedup_key="k", payload=PAYLOAD) == 0
    )
    notification = Notification.objects.get()
    assert notification.scope == "SYSTEM" and notification.level == "INFO"
    assert NotificationDelivery.objects.filter(channel="PUSH").count() == 2


def test_owner_event_without_recipient_is_programming_error() -> None:
    with pytest.raises(ImproperlyConfigured):
        NotificationService().notify("system.auth.login", dedup_key="k", payload=PAYLOAD)


def test_permission_is_required() -> None:
    owner = UserFactory()
    assert (
        NotificationService().notify(
            "finance.income.received", recipient=owner, dedup_key="k", payload=PAYLOAD
        )
        == 0
    )
    grant(owner, "finance.income.read")
    owner = type(owner).objects.get(pk=owner.pk)  # user nạp lại như request mới (bỏ cache quyền)
    assert (
        NotificationService().notify(
            "finance.income.received", recipient=owner, dedup_key="k", payload=PAYLOAD
        )
        == 1
    )


def test_subscribers_only_users_with_permission(superuser: Any) -> None:
    UserFactory()
    NotificationService().notify("system.notification.delivery_failed", dedup_key="h", payload=PAYLOAD)
    assert list(Notification.objects.values_list("recipient_id", flat=True)) == [superuser.pk]


def test_preference_disables_push_and_error_forces_in_app(user: Any) -> None:
    PushDevice.objects.create(user=user, fcm_token="a")
    NotificationPreference.objects.create(
        user=user, event_code="system.announcement.published", channel="PUSH", is_enabled=False
    )
    NotificationPreference.objects.create(
        user=user, event_code="system.announcement.published", channel="IN_APP", is_enabled=False
    )
    NotificationService().notify(
        "system.announcement.published",
        recipient=user,
        dedup_key="k",
        payload=NotificationPayload(title="t", level="ERROR"),
    )
    notification = Notification.objects.get()
    assert notification.expires_at is None  # ERROR luôn hiện trong chuông
    assert not NotificationDelivery.objects.exists()


def test_failure_never_breaks_caller(user: Any) -> None:
    with patch(
        "app.system.repositories.notification_repository.NotificationRepository.bulk_create",
        side_effect=RuntimeError,
    ):
        assert (
            NotificationService().notify("system.auth.login", recipient=user, dedup_key="k", payload=PAYLOAD)
            == 0
        )


def test_rollback_removes_everything(user: Any) -> None:
    with pytest.raises(ValueError), transaction.atomic():
        NotificationService().notify("system.auth.login", recipient=user, dedup_key="k", payload=PAYLOAD)
        raise ValueError
    assert not Notification.objects.exists()


def test_push_retry_backoff_and_permanent_failure(user: Any, django_capture_on_commit_callbacks: Any) -> None:
    device = PushDevice.objects.create(user=user, fcm_token="a")
    with (
        patch(
            "app.system.services.fcm_client.FcmClient.send",
            return_value=PushSendResult(ok=False, error_code="PUSH_UNAVAILABLE"),
        ),
        django_capture_on_commit_callbacks(execute=True),
    ):
        NotificationService().notify(
            "system.announcement.published", recipient=user, dedup_key="k", payload=PAYLOAD
        )
        # `notify` chỉ ghi outbox, không gửi trong request; lượt dispatch (QStash/cron) mới gửi.
        assert NotificationDelivery.objects.get().attempts == 0
        NotificationService().dispatch_pending()
    delivery = NotificationDelivery.objects.get()
    assert delivery.status == "PENDING" and delivery.attempts == 1 and delivery.next_attempt_at is not None
    delivery.next_attempt_at = None
    delivery.save()
    with patch(
        "app.system.services.fcm_client.FcmClient.send",
        return_value=PushSendResult(ok=False, error_code="PUSH_TOKEN_INVALID", permanent=True),
    ):
        NotificationService().dispatch_pending()
    delivery.refresh_from_db()
    device.refresh_from_db()
    assert delivery.status == "FAILED" and not device.is_active


def test_revoked_permission_is_skipped(django_capture_on_commit_callbacks: Any) -> None:
    owner = UserFactory()
    role = grant(owner, "finance.income.read")
    NotificationPreference.objects.create(
        user=owner, event_code="finance.income.received", channel="EMAIL", is_enabled=True
    )
    NotificationService().notify("finance.income.received", recipient=owner, dedup_key="k", payload=PAYLOAD)
    role.delete()
    NotificationService().dispatch_pending()
    assert NotificationDelivery.objects.get().last_error_code == "NOTIFICATION_PERMISSION_REVOKED"


def test_expired_push_token_does_not_alert_admins(user: Any, superuser: Any) -> None:
    """Token trình duyệt hết hạn là chuyện bình thường (thiết bị tự tắt): không sinh cảnh báo gửi thất bại."""
    PushDevice.objects.create(user=user, fcm_token="cu")
    with patch(
        "app.system.services.fcm_client.FcmClient.send",
        return_value=PushSendResult(ok=False, error_code="PUSH_TOKEN_INVALID", permanent=True),
    ):
        NotificationService().notify(
            "system.announcement.published", recipient=user, dedup_key="k", payload=PAYLOAD
        )
        NotificationService().dispatch_pending()
    assert NotificationDelivery.objects.get(notification__recipient=user).status == "FAILED"
    assert not Notification.objects.filter(event_code="system.notification.delivery_failed").exists()


def test_notify_kick_false_batches_until_flush_kick(
    user: Any, django_capture_on_commit_callbacks: Any
) -> None:
    """`kick=False` gom các lượt tạo thông báo rồi chỉ gọi QStash đúng 1 lần khi `flush_kick()`."""
    PushDevice.objects.create(user=user, fcm_token="a")
    service = NotificationService()
    with (
        patch.object(service.kick_service, "kick") as mock_kick,
        django_capture_on_commit_callbacks(execute=True),
    ):
        service.notify(
            "system.announcement.published", recipient=user, dedup_key="d1", payload=PAYLOAD, kick=False
        )
        service.notify(
            "system.announcement.published", recipient=user, dedup_key="d2", payload=PAYLOAD, kick=False
        )
        assert mock_kick.call_count == 0
        assert service.flush_kick() is True
        assert service.flush_kick() is False
    assert mock_kick.call_count == 1
