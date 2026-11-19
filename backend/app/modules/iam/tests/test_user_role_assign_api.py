"""Kiểm thử endpoint gán vai trò cho người dùng: POST /api/v1/iam/users/{id}/roles."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.account.permissions.user_permission import UserPermission as A
from app.modules.iam.models.permission import Permission
from app.modules.iam.models.role import Role
from app.modules.iam.models.user_role import UserRole
from app.modules.iam.permissions.iam_permission import IamPermission as P
from app.modules.iam.tests.factories.role_factory import RoleFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/iam/users"


class TestUserRoleAssignApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST/GET /api/v1/iam/users/{id}/roles."""

    def test_assign_role_success_and_idempotent(self, superuser: User, user: User, login: Any) -> None:
        """Gán vai trò cho người dùng thành công và thao tác có tính idempotent."""
        role = RoleFactory()
        api = login(superuser)

        # 1. Gán lần đầu
        res1 = api.post(f"{BASE_URL}/{user.pk}/roles", {"role_id": str(role.pk)}, format="json")
        data1 = self.assert_success(res1, 200)
        assert [item["code"] for item in data1] == [role.code]

        # 2. Lấy danh sách vai trò
        res_get = api.get(f"{BASE_URL}/{user.pk}/roles")
        data_get = self.assert_success(res_get, 200)
        assert [item["code"] for item in data_get] == [role.code]

        # 3. Gán lại không bị trùng (idempotent)
        api.post(f"{BASE_URL}/{user.pk}/roles", {"role_id": str(role.pk)}, format="json")
        assert UserRole.objects.filter(user=user).count() == 1

    def test_assigned_role_grants_permission(self, superuser: User, staff: User, login: Any) -> None:
        """Gán vai trò xong người dùng lập tức nhận được các quyền của vai trò đó."""
        role = RoleFactory()
        role.role_permissions.create(permission=Permission.objects.get(code=A.USER_READ.code))

        staff_api = login(staff)
        self.assert_forbidden(staff_api.get("/api/v1/account/users"))

        # Superuser gán vai trò
        login(superuser).post(f"{BASE_URL}/{staff.pk}/roles", {"role_id": str(role.pk)}, format="json")
        self.assert_paginated(staff_api.get("/api/v1/account/users", {"page": 1}))

    def test_cannot_assign_role_beyond_own_permissions(self, staff_with: Any, user: User, login: Any) -> None:
        """Không thể gán vai trò có quyền cao hơn quyền của chính mình (403 IAM_PRIVILEGE_ESCALATION)."""
        member = staff_with(P.ROLE_ASSIGN)
        admin_role = Role.objects.get(code="ADMIN")

        res = login(member).post(
            f"{BASE_URL}/{user.pk}/roles", {"role_id": str(admin_role.pk)}, format="json"
        )
        self.assert_forbidden(res, "IAM_PRIVILEGE_ESCALATION")

    def test_cannot_assign_role_to_self(self, staff_with: Any, login: Any) -> None:
        """Không thể tự gán vai trò cho chính mình (403 IAM_SELF_MODIFICATION)."""
        member = staff_with(P.ROLE_ASSIGN)
        role = RoleFactory()

        res = login(member).post(f"{BASE_URL}/{member.pk}/roles", {"role_id": str(role.pk)}, format="json")
        self.assert_forbidden(res, "IAM_SELF_MODIFICATION")

    def test_inactive_role_cannot_be_assigned(self, superuser: User, user: User, login: Any) -> None:
        """Vai trò đang tắt (is_active=False) không thể gán (422 IAM_ROLE_INACTIVE)."""
        role = RoleFactory(is_active=False)
        api = login(superuser)

        res = api.post(f"{BASE_URL}/{user.pk}/roles", {"role_id": str(role.pk)}, format="json")
        self.assert_error(res, 422, "IAM_ROLE_INACTIVE")

    def test_assign_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(f"{BASE_URL}/00000000-0000-0000-0000-000000000000/roles", {}, format="json")
        self.assert_unauthorized(res)

    def test_assign_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Thiếu quyền iam.role.assign bị 403."""
        api = login(user)
        res = api.post(f"{BASE_URL}/{user.pk}/roles", {}, format="json")
        self.assert_forbidden(res)
