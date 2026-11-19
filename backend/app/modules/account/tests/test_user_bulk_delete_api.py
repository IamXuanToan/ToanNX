"""Kiểm thử endpoint xóa hàng loạt người dùng: POST /api/v1/account/users/bulk-delete."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.account.permissions.user_permission import UserPermission as A
from app.modules.account.tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/account/users/bulk-delete"


class TestUserBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/account/users/bulk-delete."""

    def test_bulk_delete_success(self, superuser: User, login: Any) -> None:
        """Xóa mềm hàng loạt người dùng thành công."""
        users = UserFactory.create_batch(2)
        ids = [str(item.pk) for item in users]
        res = login(superuser).post(URL, {"ids": ids}, format="json")
        data = self.assert_success(res, 200)
        assert data == {"count": 2}
        assert User.objects.filter(pk__in=ids, deleted_at__isnull=False).count() == 2

    def test_bulk_delete_is_all_or_nothing(self, superuser: User, login: Any) -> None:
        """Nếu danh sách chứa bản thân hoặc superuser, toàn bộ thao tác bị hủy (all-or-nothing rollback)."""
        other = UserFactory()
        ids = [str(other.pk), str(superuser.pk)]
        res = login(superuser).post(URL, {"ids": ids}, format="json")
        self.assert_error(res, 403, "ACCOUNT_SELF_MODIFICATION")
        other.refresh_from_db()
        assert other.deleted_at is None

    def test_bulk_delete_validation(self, superuser: User, login: Any) -> None:
        """Kiểm tra validate danh sách ids rỗng hoặc UUID không hợp lệ (400 VALIDATION_ERROR)."""
        api = login(superuser)
        self.assert_error(api.post(URL, {"ids": []}, format="json"), 400, "VALIDATION_ERROR")
        self.assert_error(api.post(URL, {"ids": ["invalid-uuid"]}, format="json"), 400, "VALIDATION_ERROR")

    def test_bulk_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"ids": ["00000000-0000-0000-0000-000000000000"]}, format="json")
        self.assert_unauthorized(res)

    def test_bulk_delete_forbidden_without_permission(self, staff_with: Any, user: User, login: Any) -> None:
        """Người dùng thiếu quyền account.user.delete bị 403."""
        actor = staff_with(A.USER_UPDATE.code)
        res = login(actor).post(URL, {"ids": [str(user.pk)]}, format="json")
        self.assert_forbidden(res)
