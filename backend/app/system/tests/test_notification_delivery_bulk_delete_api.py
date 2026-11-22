"""Kiểm thử endpoint xóa lô lần gửi thông báo: POST /api/v1/system/notification-deliveries/bulk-delete."""

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
URL = "/api/v1/system/notification-deliveries/bulk-delete"


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


class TestNotificationDeliveryBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/system/notification-deliveries/bulk-delete."""

    def test_bulk_delete_success(self, user: User, login: Any) -> None:
        """Xóa mềm cả lô của chính mình."""
        items = [_delivery(user), _delivery(user)]
        grant(user, P.DELETE)

        res = login(user).post(URL, {"ids": [str(item.pk) for item in items]}, format="json")
        data = self.assert_success(res, 200)

        assert data["count"] == 2
        for item in items:
            item.refresh_from_db()
            assert item.deleted_at is not None

    def test_bulk_delete_validation_missing_ids(self, user: User, login: Any) -> None:
        """Thiếu `ids` bị 400 VALIDATION_ERROR."""
        grant(user, P.DELETE)
        error = self.assert_error(login(user).post(URL, {}, format="json"), 400, "VALIDATION_ERROR")
        assert "ids" in error["details"]

    def test_bulk_delete_owner_isolation(self, user: User, login: Any) -> None:
        """Lô có lần gửi của người khác → 404, không dòng nào bị xóa."""
        own = _delivery(user)
        other = _delivery(UserFactory())
        grant(user, P.DELETE)

        payload = {"ids": [str(own.pk), str(other.pk)]}
        self.assert_error(login(user).post(URL, payload, format="json"), 404, "NOT_FOUND")
        own.refresh_from_db()
        assert own.deleted_at is None

    def test_bulk_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        self.assert_unauthorized(client.post(URL, {"ids": []}, format="json"))

    def test_bulk_delete_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Thiếu quyền xóa bị 403."""
        grant(user, P.READ)
        self.assert_forbidden(login(user).post(URL, {"ids": []}, format="json"))
