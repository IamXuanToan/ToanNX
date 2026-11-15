"""Test xóa vai trò và thao tác hàng loạt (/iam/roles/{id}, /bulk-update, /bulk-delete)."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.iam.models.role import Role
from app.modules.iam.models.user_role import UserRole
from app.modules.iam.services.permission_checker import permission_checker
from app.modules.iam.tests.factories.role_factory import RoleFactory

pytestmark = pytest.mark.django_db

ROLES = "/api/v1/iam/roles"
BULK_UPDATE = f"{ROLES}/bulk-update"
BULK_DELETE = f"{ROLES}/bulk-delete"


class TestRoleDelete(BaseApiTestCase):
    """Xóa mềm vai trò."""

    def test_delete_custom_role(self, superuser: User, login: Any) -> None:
        role = RoleFactory()
        assert login(superuser).delete(f"{ROLES}/{role.pk}").status_code == 204
        role.refresh_from_db()
        assert role.deleted_at is not None
        assert role.is_active is False
        self.assert_error(login(superuser).get(f"{ROLES}/{role.pk}"), 404, "NOT_FOUND")

    def test_cannot_delete_system_role(self, superuser: User, login: Any) -> None:
        role = Role.objects.get(code="ADMIN")
        self.assert_error(login(superuser).delete(f"{ROLES}/{role.pk}"), 403, "IAM_SYSTEM_ROLE_PROTECTED")

    def test_deleted_role_no_longer_grants_permissions(self, superuser: User, user: User, login: Any) -> None:
        role = Role.objects.create(code="TMP_READER", name="Tạm")
        role.role_permissions.create(
            permission_id=Role.objects.get(code="VIEWER").role_permissions.first().permission_id
        )  # type: ignore[union-attr]
        UserRole.objects.create(user=user, role=role)
        assert permission_checker.get_permissions(User.objects.get(pk=user.pk))
        login(superuser).delete(f"{ROLES}/{role.pk}")
        # Lấy lại user: quyền được cache trên object.
        assert permission_checker.get_permissions(User.objects.get(pk=user.pk)) == set()


class TestRoleBulkApi(BaseApiTestCase):
    """Bật/tắt và xóa nhiều vai trò."""

    def test_bulk_toggle(self, superuser: User, login: Any) -> None:
        roles = RoleFactory.create_batch(2)
        ids = [str(role.pk) for role in roles]
        data = self.assert_success(
            login(superuser).post(BULK_UPDATE, {"ids": ids, "is_active": False}, format="json")
        )
        assert data == {"count": 2}
        assert not Role.objects.filter(pk__in=ids, is_active=True).exists()

    def test_bulk_delete_is_all_or_nothing(self, superuser: User, login: Any) -> None:
        custom = RoleFactory()
        system = Role.objects.get(code="VIEWER")
        payload = {"ids": [str(custom.pk), str(system.pk)]}
        self.assert_error(
            login(superuser).post(BULK_DELETE, payload, format="json"), 403, "IAM_SYSTEM_ROLE_PROTECTED"
        )
        custom.refresh_from_db()
        assert custom.deleted_at is None

    def test_bulk_delete(self, superuser: User, login: Any) -> None:
        roles = RoleFactory.create_batch(3)
        ids = [str(role.pk) for role in roles]
        assert self.assert_success(login(superuser).post(BULK_DELETE, {"ids": ids}, format="json")) == {
            "count": 3
        }

    def test_sort_by_permission_count(self, superuser: User, login: Any) -> None:
        items, _ = self.assert_paginated(login(superuser).get(f"{ROLES}?page=1&ordering=-permission_count"))
        counts = [item["permission_count"] for item in items]
        assert counts == sorted(counts, reverse=True)
