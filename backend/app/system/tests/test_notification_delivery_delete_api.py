"""Kiểm thử endpoint xóa lần gửi thông báo: DELETE /api/v1/system/notification-deliveries/{id}."""

from typing import Any
from uuid import uuid4

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.constants.notification_channel import NotificationChannel
from app.system.constants.notification_scope import NotificationScope
from app.system.models.notification import Notification
from app.system.models.notification_delivery import NotificationDelivery
from app.system.models.user import User
from app.system.permissions.notification_delivery_permission import NotificationDeliveryPermission as P
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/notification-deliveries"


def _delivery(recipient: Any) -> NotificationDelivery:
    """Một lần gửi email của thông báo gửi tới `recipient`."""
    notification = Notification.objects.create(
        recipient=recipient,
        scope=NotificationScope.PERSONAL,
        event_code="system.auth.login",
        module="system",
        title="Có lượt đăng nhập",
        dedup_key=f"test-{uuid4()}",  # unique theo (người nhận, sự kiện, dedup_key)
    )
    return NotificationDelivery.objects.create(
        notification=notification, channel=NotificationChannel.EMAIL, target="nhan@toannx.local"
    )


class TestNotificationDeliveryDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/system/notification-deliveries/{id}."""

    def test_delete_own_success(self, user: User, login: Any) -> None:
        """Xóa mềm lần gửi của chính mình (204)."""
        delivery = _delivery(user)
        grant(user, P.DELETE)

        res = login(user).delete(f"{URL}/{delivery.pk}")

        assert res.status_code == 204
        delivery.refresh_from_db()
        assert delivery.deleted_at is not None

    def test_delete_other_user_not_found(self, user: User, login: Any) -> None:
        """Lần gửi của người khác (không có manage_all) trả 404 và còn nguyên."""
        delivery = _delivery(UserFactory())
        grant(user, P.DELETE)

        self.assert_error(login(user).delete(f"{URL}/{delivery.pk}"), 404, "NOT_FOUND")
        delivery.refresh_from_db()
        assert delivery.deleted_at is None

    def test_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        self.assert_unauthorized(client.delete(f"{URL}/00000000-0000-0000-0000-000000000000"))

    def test_delete_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Chỉ có quyền đọc, thiếu system.notification_delivery.delete bị 403."""
        delivery = _delivery(user)
        grant(user, P.READ)
        self.assert_forbidden(login(user).delete(f"{URL}/{delivery.pk}"))
