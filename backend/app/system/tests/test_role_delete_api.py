"""Kiểm thử endpoint xóa vai trò: DELETE /api/v1/system/roles/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.role import Role
from app.system.models.user import User
from app.system.models.user_role import UserRole
from app.system.services.permission_checker import permission_checker
from app.system.tests.factories.role_factory import RoleFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/system/roles"


class TestRoleDeleteApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/system/roles/{id}."""

    def test_delete_custom_role_success(self, superuser: User, login: Any) -> None:
        """Xóa mềm vai trò tùy chỉnh thành công (204 No Content)."""
        role = RoleFactory()
        api = login(superuser)

        res = api.delete(f"{BASE_URL}/{role.pk}")
        assert res.status_code == 204

        role.refresh_from_db()
        assert role.deleted_at is not None
        assert role.is_active is False
        self.assert_error(api.get(f"{BASE_URL}/{role.pk}"), 404, "NOT_FOUND")

    def test_delete_system_role_protected(self, superuser: User, login: Any) -> None:
        """Không thể xóa vai trò hệ thống (403 IAM_SYSTEM_ROLE_PROTECTED)."""
        admin_role = Role.objects.get(code="ADMIN")
        api = login(superuser)

        res = api.delete(f"{BASE_URL}/{admin_role.pk}")
        self.assert_error(res, 403, "IAM_SYSTEM_ROLE_PROTECTED")

    def test_deleted_role_no_longer_grants_permissions(self, superuser: User, user: User, login: Any) -> None:
        """Vai trò bị xóa sẽ không còn cấp quyền cho các người dùng đã gán nó."""
        role = Role.objects.create(code="TMP_ROLE", name="Tạm")
        admin_perm = Role.objects.get(code="ADMIN").role_permissions.first()
        assert admin_perm is not None
        role.role_permissions.create(permission_id=admin_perm.permission_id)
        UserRole.objects.create(user=user, role=role)

        assert permission_checker.get_permissions(User.objects.get(pk=user.pk))
        login(superuser).delete(f"{BASE_URL}/{role.pk}")
        assert permission_checker.get_permissions(User.objects.get(pk=user.pk)) == set()

    def test_delete_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.delete(f"{BASE_URL}/00000000-0000-0000-0000-000000000000")
        self.assert_unauthorized(res)

    def test_delete_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Thiếu quyền system.role.delete bị 403."""
        role = RoleFactory()
        api = login(user)
        res = api.delete(f"{BASE_URL}/{role.pk}")
        self.assert_forbidden(res)
