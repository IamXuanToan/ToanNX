"""Test PUT /iam/users/{id}/roles và PUT /iam/roles/{id}/permissions: thay toàn bộ trong một transaction."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.account.permissions.account_permission import AccountPermission as A
from app.modules.iam.models.permission import Permission
from app.modules.iam.models.role import Role
from app.modules.iam.models.role_permission import RolePermission
from app.modules.iam.models.user_role import UserRole
from app.modules.iam.permissions.iam_permission import IamPermission as P
from app.modules.iam.tests.factories.role_factory import RoleFactory

pytestmark = pytest.mark.django_db

USERS = "/api/v1/iam/users"
ROLES = "/api/v1/iam/roles"


class TestIamSyncApi(BaseApiTestCase):
    """Đồng bộ vai trò của người dùng và quyền của vai trò."""

    def test_sync_user_roles_adds_and_removes(self, superuser: User, user: User, login: Any) -> None:
        api = login(superuser)
        keep, drop, add = RoleFactory(), RoleFactory(), RoleFactory()
        UserRole.objects.create(user=user, role=keep)
        UserRole.objects.create(user=user, role=drop)
        data = self.assert_success(
            api.put(f"{USERS}/{user.pk}/roles", {"role_ids": [str(keep.pk), str(add.pk)]}, format="json")
        )
        assert {item["code"] for item in data} == {keep.code, add.code}
        assert set(UserRole.objects.filter(user=user).values_list("role_id", flat=True)) == {keep.pk, add.pk}

    def test_sync_user_roles_is_all_or_nothing(self, staff_with: Any, user: User, login: Any) -> None:
        """Một vai trò vượt quyền → 403 và vai trò hợp lệ trong cùng lần lưu cũng không được gán."""
        member = staff_with(P.ROLE_ASSIGN)
        allowed = RoleFactory()
        admin_role = Role.objects.get(code="ADMIN")
        response = login(member).put(
            f"{USERS}/{user.pk}/roles",
            {"role_ids": [str(allowed.pk), str(admin_role.pk)]},
            format="json",
        )
        self.assert_forbidden(response, "IAM_PRIVILEGE_ESCALATION")
        assert not UserRole.objects.filter(user=user).exists()

    def test_sync_user_roles_requires_permission(self, staff: User, user: User, login: Any) -> None:
        response = login(staff).put(f"{USERS}/{user.pk}/roles", {"role_ids": []}, format="json")
        self.assert_forbidden(response)

    def test_sync_role_permissions_adds_and_removes(self, superuser: User, login: Any) -> None:
        api = login(superuser)
        role = RoleFactory()
        read = Permission.objects.get(code=A.USER_READ.code)
        create = Permission.objects.get(code=A.USER_CREATE.code)
        RolePermission.objects.create(role=role, permission=read)
        data = self.assert_success(
            api.put(f"{ROLES}/{role.pk}/permissions", {"permission_ids": [str(create.pk)]}, format="json")
        )
        assert data["id"] == str(role.pk)
        assert list(RolePermission.objects.filter(role=role).values_list("permission_id", flat=True)) == [
            create.pk
        ]

    def test_sync_role_permissions_is_all_or_nothing(self, staff_with: Any, login: Any) -> None:
        """Có một quyền người thực hiện không có → 403 và không quyền nào được cấp."""
        member = staff_with(P.PERMISSION_ASSIGN, P.ROLE_UPDATE, A.USER_READ)
        role = RoleFactory()
        mine = Permission.objects.get(code=A.USER_READ.code)
        foreign = Permission.objects.get(code=A.USER_DELETE.code)
        response = login(member).put(
            f"{ROLES}/{role.pk}/permissions",
            {"permission_ids": [str(mine.pk), str(foreign.pk)]},
            format="json",
        )
        self.assert_forbidden(response, "IAM_PRIVILEGE_ESCALATION")
        assert not RolePermission.objects.filter(role=role).exists()

    def test_sync_rejects_too_many_ids(self, superuser: User, user: User, login: Any) -> None:
        ids = [str(RoleFactory.build().pk) for _ in range(101)]
        response = login(superuser).put(f"{USERS}/{user.pk}/roles", {"role_ids": ids}, format="json")
        self.assert_error(response, 400)
