"""Test PermissionChecker và đồng bộ quyền."""

from typing import Any

import pytest

from app.system.models.permission import Permission
from app.system.models.role import Role
from app.system.models.role_auto_grant import RoleAutoGrant
from app.system.models.user import User
from app.system.permissions.iam_permission import IamPermission as P
from app.system.permissions.user_permission import UserPermission as A
from app.system.services.iam_sync_service import IamSyncService
from app.system.services.permission_checker import PermissionChecker
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db


class TestPermissionChecker:
    """Đánh giá quyền."""

    def test_sync_creates_permissions_with_description(self) -> None:
        permission = Permission.objects.get(code=A.USER_READ.code, is_active=True)
        assert permission.description == A.USER_READ.description

    def test_system_roles_granted_by_auto_grant_config(self) -> None:
        """ADMIN là vai trò hệ thống duy nhất, nhận mọi quyền theo auto_grant=all."""
        admin = Role.objects.get(auto_grant=RoleAutoGrant.ALL)
        assert admin.code == "ADMIN" and admin.is_system
        assert list(Role.objects.alive().filter(is_system=True).values_list("code", flat=True)) == ["ADMIN"]
        assert admin.role_permissions.count() == Permission.objects.filter(is_active=True).count()

    def test_new_custom_role_with_auto_grant_receives_permissions(self) -> None:
        role = Role.objects.create(code="AUDITOR", name="Auditor", auto_grant=RoleAutoGrant.READ_ONLY)
        assert IamSyncService().sync()["granted"] > 0
        assert (
            role.role_permissions.count() == Permission.objects.filter(is_active=True, action="read").count()
        )

    def test_default_deny(self, user: User) -> None:
        assert PermissionChecker().has_permission(user, A.USER_READ) is False

    def test_superuser_bypass(self, superuser: User) -> None:
        assert PermissionChecker().has_permission(superuser, "anything.at.all") is True

    def test_inactive_superuser_denied(self) -> None:
        inactive = UserFactory(is_superuser=True, is_staff=True, is_active=False)
        assert PermissionChecker().has_permission(inactive, A.USER_READ) is False

    def test_multiple_roles_aggregate(self, user: User) -> None:
        grant(user, A.USER_READ)
        grant(user, P.ROLE_READ)
        checker = PermissionChecker()
        assert checker.has_all_permissions(user, [A.USER_READ, P.ROLE_READ])
        assert not checker.has_permission(user, A.USER_CREATE)
        assert checker.has_any_permission(user, [A.USER_CREATE, P.ROLE_READ])

    def test_inactive_role_grants_nothing(self, user: User) -> None:
        role = grant(user, A.USER_READ)
        role.is_active = False
        role.save()
        assert not PermissionChecker().has_permission(user, A.USER_READ)

    def test_permissions_cached_per_request_object(self, user: User, django_assert_num_queries: Any) -> None:
        grant(user, A.USER_READ)
        checker = PermissionChecker()
        with django_assert_num_queries(1):
            checker.has_permission(user, A.USER_READ)
            checker.has_permission(user, P.ROLE_READ)

    def test_django_has_perm_integration(self, user: User) -> None:
        grant(user, A.USER_READ)
        assert user.has_perm(A.USER_READ)
        assert not user.has_perm(A.USER_CREATE)
