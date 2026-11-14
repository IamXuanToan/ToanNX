"""Test /iam/users/{id}/roles."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.account.permissions.account_permission import AccountPermission as A
from app.modules.iam.models.permission import Permission
from app.modules.iam.models.role import Role
from app.modules.iam.models.user_role import UserRole
from app.modules.iam.permissions.iam_permission import IamPermission as P
from app.modules.iam.tests.factories.role_factory import RoleFactory

pytestmark = pytest.mark.django_db

USERS = "/api/v1/iam/users"
ACCOUNT_USERS = "/api/v1/account/users"


class TestUserRoleApi(BaseApiTestCase):
    """Gán/thu hồi vai trò cho người dùng."""

    def test_assign_and_revoke_role(self, superuser: User, user: User, login: Any) -> None:
        api = login(superuser)
        role = RoleFactory()
        data = self.assert_success(
            api.post(f"{USERS}/{user.pk}/roles", {"role_id": str(role.pk)}, format="json")
        )
        assert [item["code"] for item in data] == [role.code]
        listed = self.assert_success(api.get(f"{USERS}/{user.pk}/roles"))
        assert [item["code"] for item in listed] == [role.code]
        # Idempotent
        self.assert_success(api.post(f"{USERS}/{user.pk}/roles", {"role_id": str(role.pk)}, format="json"))
        assert UserRole.objects.filter(user=user).count() == 1
        assert api.delete(f"{USERS}/{user.pk}/roles/{role.pk}").status_code == 204
        assert not UserRole.objects.filter(user=user).exists()
        self.assert_error(api.delete(f"{USERS}/{user.pk}/roles/{role.pk}"), 404)

    def test_assigned_role_grants_permission(self, superuser: User, staff: User, login: Any) -> None:
        role = RoleFactory()
        role.role_permissions.create(permission=Permission.objects.get(code=A.USER_READ.code))
        staff_api = login(staff)
        self.assert_forbidden(staff_api.get(ACCOUNT_USERS))
        login(superuser).post(f"{USERS}/{staff.pk}/roles", {"role_id": str(role.pk)}, format="json")
        self.assert_paginated(staff_api.get(ACCOUNT_USERS))

    def test_cannot_assign_role_beyond_own_permissions(self, staff_with: Any, user: User, login: Any) -> None:
        member = staff_with(P.ROLE_ASSIGN)
        admin_role = Role.objects.get(code="ADMIN")
        response = login(member).post(
            f"{USERS}/{user.pk}/roles", {"role_id": str(admin_role.pk)}, format="json"
        )
        self.assert_forbidden(response, "IAM_PRIVILEGE_ESCALATION")

    def test_cannot_assign_role_to_self(self, staff_with: Any, login: Any) -> None:
        member = staff_with(P.ROLE_ASSIGN)
        role = RoleFactory()
        response = login(member).post(f"{USERS}/{member.pk}/roles", {"role_id": str(role.pk)}, format="json")
        self.assert_forbidden(response, "IAM_SELF_MODIFICATION")

    def test_inactive_role_cannot_be_assigned(self, superuser: User, user: User, login: Any) -> None:
        role = RoleFactory(is_active=False)
        response = login(superuser).post(f"{USERS}/{user.pk}/roles", {"role_id": str(role.pk)}, format="json")
        self.assert_error(response, 422, "IAM_ROLE_INACTIVE")
