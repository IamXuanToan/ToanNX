"""Kiểm thử endpoint cập nhật hàng loạt vai trò: POST /api/v1/system/roles/bulk-update."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.role import Role
from app.system.models.user import User
from app.system.tests.factories.role_factory import RoleFactory

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/roles/bulk-update"


class TestRoleBulkUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/system/roles/bulk-update."""

    def test_bulk_update_toggle_active_success(self, superuser: User, login: Any) -> None:
        """Bật/tắt trạng thái is_active hàng loạt vai trò thành công."""
        roles = RoleFactory.create_batch(2)
        ids = [str(role.pk) for role in roles]
        api = login(superuser)

        data = self.assert_success(api.post(URL, {"ids": ids, "is_active": False}, format="json"), 200)
        assert data == {"count": 2}
        assert not Role.objects.filter(pk__in=ids, is_active=True).exists()

    def test_bulk_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"ids": [], "is_active": False}, format="json")
        self.assert_unauthorized(res)

    def test_bulk_update_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Thiếu quyền system.role.update bị 403."""
        api = login(user)
        res = api.post(URL, {"ids": [], "is_active": False}, format="json")
        self.assert_forbidden(res)
