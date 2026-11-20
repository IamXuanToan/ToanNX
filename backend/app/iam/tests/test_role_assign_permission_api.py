"""Kiểm thử endpoint gán quyền cho vai trò: POST /api/v1/iam/roles/{id}/permissions."""

from typing import Any

import pytest

from app.account.models.user import User
from app.account.permissions.user_permission import UserPermission as A
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.models.permission import Permission
from app.iam.permissions.iam_permission import IamPermission as P
from app.iam.tests.factories.role_factory import RoleFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/iam/roles"


class TestRoleAssignPermissionApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/iam/roles/{id}/permissions."""

    def test_assign_permission_success(self, superuser: User, login: Any) -> None:
        """Gán quyền thành công cho vai trò."""
        role = RoleFactory()
        permission = Permission.objects.get(code=A.USER_READ.code)
        api = login(superuser)

        res = api.post(
            f"{BASE_URL}/{role.pk}/permissions", {"permission_id": str(permission.pk)}, format="json"
        )
        data = self.assert_success(res, 200)

        assert [item["code"] for item in data["permissions"]] == [A.USER_READ.code]
        assert data["permission_count"] == 1

    def test_cannot_grant_permission_not_held_privilege_escalation(self, staff_with: Any, login: Any) -> None:
        """Staff không thể gán quyền mà chính mình không sở hữu (403 IAM_PRIVILEGE_ESCALATION)."""
        member = staff_with(P.PERMISSION_ASSIGN)
        role = RoleFactory()
        permission = Permission.objects.get(code=A.USER_CREATE.code)

        res = login(member).post(
            f"{BASE_URL}/{role.pk}/permissions", {"permission_id": str(permission.pk)}, format="json"
        )
        self.assert_forbidden(res, "IAM_PRIVILEGE_ESCALATION")

    def test_assign_permission_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(f"{BASE_URL}/00000000-0000-0000-0000-000000000000/permissions", {}, format="json")
        self.assert_unauthorized(res)

    def test_assign_permission_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Thiếu quyền iam.permission.assign bị 403."""
        role = RoleFactory()
        api = login(user)
        res = api.post(f"{BASE_URL}/{role.pk}/permissions", {}, format="json")
        self.assert_forbidden(res)
