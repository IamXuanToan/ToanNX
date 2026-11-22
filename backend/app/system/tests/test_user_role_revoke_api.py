"""Kiểm thử endpoint thu hồi vai trò khỏi người dùng: DELETE /api/v1/system/users/{id}/roles/{role_id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.user import User
from app.system.models.user_role import UserRole
from app.system.tests.factories.role_factory import RoleFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/system/users"


class TestUserRoleRevokeApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint DELETE /api/v1/system/users/{id}/roles/{role_id}."""

    def test_revoke_role_success(self, superuser: User, user: User, login: Any) -> None:
        """Thu hồi vai trò khỏi người dùng thành công (204 No Content)."""
        role = RoleFactory()
        UserRole.objects.create(user=user, role=role)
        api = login(superuser)

        res = api.delete(f"{BASE_URL}/{user.pk}/roles/{role.pk}")
        assert res.status_code == 204
        assert not UserRole.objects.filter(user=user, role=role).exists()

        # Xóa lần 2 trả về 404
        self.assert_error(api.delete(f"{BASE_URL}/{user.pk}/roles/{role.pk}"), 404, "NOT_FOUND")

    def test_revoke_role_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.delete(
            f"{BASE_URL}/00000000-0000-0000-0000-000000000000/roles/00000000-0000-0000-0000-000000000000"
        )
        self.assert_unauthorized(res)

    def test_revoke_role_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Thiếu quyền system.role.assign bị 403."""
        role = RoleFactory()
        api = login(user)
        res = api.delete(f"{BASE_URL}/{user.pk}/roles/{role.pk}")
        self.assert_forbidden(res)
