"""Kiểm thử endpoint cập nhật vai trò: PATCH /api/v1/system/roles/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.role import Role
from app.system.models.user import User
from app.system.permissions.iam_permission import IamPermission as P
from app.system.tests.factories.role_factory import RoleFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/system/roles"


class TestRoleUpdateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint PATCH /api/v1/system/roles/{id}."""

    def test_update_custom_role_success(self, superuser: User, login: Any) -> None:
        """Cập nhật tên vai trò tùy chỉnh thành công."""
        role = RoleFactory(name="Tên Cũ")
        api = login(superuser)

        res = api.patch(f"{BASE_URL}/{role.pk}", {"name": "Tên Đã Sửa"}, format="json")
        data = self.assert_success(res, 200)
        assert data["name"] == "Tên Đã Sửa"

        role.refresh_from_db()
        assert role.name == "Tên Đã Sửa"

    def test_update_cannot_change_code(self, superuser: User, login: Any) -> None:
        """Không cho phép sửa trường code của vai trò (bị 400)."""
        role = RoleFactory()
        api = login(superuser)

        res = api.patch(f"{BASE_URL}/{role.pk}", {"code": "NEW_CODE"}, format="json")
        self.assert_error(res, 400, "VALIDATION_ERROR")

    def test_update_system_role_protected_for_non_superuser(self, staff_with: Any, login: Any) -> None:
        """Staff có quyền UPDATE vẫn không được sửa vai trò hệ thống (403 IAM_SYSTEM_ROLE_PROTECTED)."""
        member = staff_with(P.ROLE_UPDATE)
        admin_role = Role.objects.get(code="ADMIN")
        res = login(member).patch(f"{BASE_URL}/{admin_role.pk}", {"name": "Hacked"}, format="json")
        self.assert_forbidden(res, "IAM_SYSTEM_ROLE_PROTECTED")

    def test_update_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.patch(f"{BASE_URL}/00000000-0000-0000-0000-000000000000", {}, format="json")
        self.assert_unauthorized(res)

    def test_update_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Thiếu quyền system.role.update bị 403."""
        role = RoleFactory()
        api = login(user)
        res = api.patch(f"{BASE_URL}/{role.pk}", {"name": "Đổi"}, format="json")
        self.assert_forbidden(res)
