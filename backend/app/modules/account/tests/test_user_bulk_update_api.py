"""Kiểm thử endpoint cập nhật hàng loạt người dùng: POST /api/v1/account/users/bulk-update."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.account.permissions.user_permission import UserPermission as A
from app.modules.account.tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/account/users/bulk-update"


class TestUserBulkUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/account/users/bulk-update."""

    def test_bulk_lock_and_unlock(self, superuser: User, login: Any) -> None:
        """Khóa và mở khóa hàng loạt người dùng thành công."""
        users = UserFactory.create_batch(3)
        ids = [str(item.pk) for item in users]
        api = login(superuser)

        # Khóa toàn bộ
        res = api.post(URL, {"ids": ids, "is_active": False}, format="json")
        data = self.assert_success(res, 200)
        assert data == {"count": 3}
        assert not User.objects.filter(pk__in=ids, is_active=True).exists()

        # Mở khóa toàn bộ
        res = api.post(URL, {"ids": ids, "is_active": True}, format="json")
        data = self.assert_success(res, 200)
        assert data == {"count": 3}
        assert User.objects.filter(pk__in=ids, is_active=True).count() == 3

    def test_bulk_lock_protects_last_superuser(self, superuser: User, login: Any) -> None:
        """Cập nhật khóa hàng loạt không được phép khóa superuser duy nhất còn lại."""
        user = UserFactory()
        payload = {"ids": [str(user.pk), str(superuser.pk)], "is_active": False}
        res = login(superuser).post(URL, payload, format="json")
        self.assert_error(res, 422, "ACCOUNT_LAST_SUPERUSER")
        user.refresh_from_db()
        assert user.is_active is True

    def test_bulk_update_validation(self, superuser: User, login: Any) -> None:
        """Payload thiếu trường hoặc ids không hợp lệ trả về 400 VALIDATION_ERROR."""
        api = login(superuser)
        # Thiếu is_active
        self.assert_error(
            api.post(URL, {"ids": [str(superuser.pk)]}, format="json"), 400, "VALIDATION_ERROR"
        )
        # ids rỗng
        self.assert_error(
            api.post(URL, {"ids": [], "is_active": False}, format="json"), 400, "VALIDATION_ERROR"
        )

    def test_bulk_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"ids": ["00000000-0000-0000-0000-000000000000"], "is_active": False}, format="json")
        self.assert_unauthorized(res)

    def test_bulk_update_forbidden_without_permission(self, staff_with: Any, user: User, login: Any) -> None:
        """Người dùng thiếu quyền account.user.update bị 403."""
        actor = staff_with(A.USER_READ.code)
        res = login(actor).post(URL, {"ids": [str(user.pk)], "is_active": False}, format="json")
        self.assert_forbidden(res)
