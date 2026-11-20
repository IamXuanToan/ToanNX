"""Kiểm thử endpoint thu hồi quyền khỏi vai trò: DELETE /api/v1/iam/roles/{id}/permissions/{permission_id}."""

from typing import Any

import pytest

from app.account.models.user import User
from app.account.permissions.user_permission import UserPermission as A
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.models.permission import Permission
from app.iam.tests.factories.role_factory import RoleFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/iam/roles"


class TestRoleRevokePermissionApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/iam/roles/{id}/permissions/{permission_id}."""

    def test_revoke_permission_success(self, superuser: User, login: Any) -> None:
        """Thu hồi quyền khỏi vai trò thành công (204 No Content)."""
        role = RoleFactory()
        permission = Permission.objects.get(code=A.USER_READ.code)
        role.role_permissions.create(permission=permission)

        api = login(superuser)
        res = api.delete(f"{BASE_URL}/{role.pk}/permissions/{permission.pk}")
        assert res.status_code == 204

        # Xóa lần 2 trả về 404
        self.assert_error(api.delete(f"{BASE_URL}/{role.pk}/permissions/{permission.pk}"), 404, "NOT_FOUND")

    def test_revoke_permission_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.delete(
            f"{BASE_URL}/00000000-0000-0000-0000-000000000000/permissions/00000000-0000-0000-0000-000000000000"
        )
        self.assert_unauthorized(res)

    def test_revoke_permission_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Thiếu quyền iam.permission.assign bị 403."""
        role = RoleFactory()
        permission = Permission.objects.get(code=A.USER_READ.code)
        api = login(user)
        res = api.delete(f"{BASE_URL}/{role.pk}/permissions/{permission.pk}")
        self.assert_forbidden(res)
