"""Test /iam/roles, /iam/roles/{id}/permissions, /iam/permissions."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.account.permissions.user_permission import UserPermission as A
from app.modules.iam.models.permission import Permission
from app.modules.iam.models.role import Role
from app.modules.iam.permissions.iam_permission import IamPermission as P
from app.modules.iam.tests.factories.role_factory import RoleFactory

pytestmark = pytest.mark.django_db

ROLES = "/api/v1/iam/roles"


class TestRoleApi(BaseApiTestCase):
    """Vai trò và gán quyền."""

    def test_create_and_update_role(self, superuser: User, login: Any) -> None:
        api = login(superuser)
        data = self.assert_success(
            api.post(ROLES, {"code": "EDITOR", "name": "Biên tập"}, format="json"), 201
        )
        assert data["is_system"] is False and data["permissions"] == []
        self.assert_error(
            api.post(ROLES, {"code": "EDITOR", "name": "x"}, format="json"), 409, "IAM_ROLE_CODE_EXISTS"
        )
        self.assert_error(api.post(ROLES, {"code": "bad code", "name": "x"}, format="json"), 400)
        updated = self.assert_success(
            api.patch(f"{ROLES}/{data['id']}", {"name": "Biên tập viên"}, format="json")
        )
        assert updated["name"] == "Biên tập viên"
        self.assert_error(api.patch(f"{ROLES}/{data['id']}", {"code": "X"}, format="json"), 400)

    def test_list_roles(self, superuser: User, login: Any) -> None:
        api = login(superuser)
        items, _ = self.assert_paginated(api.get(ROLES, {"page": 1}))
        assert {item["code"] for item in items} >= {"ADMIN", "VIEWER"}

        items, _ = self.assert_paginated(api.get(ROLES, {"page": 1, "auto_grant": "all"}))
        assert [item["code"] for item in items] == ["ADMIN"]

        items, _ = self.assert_paginated(api.get(ROLES, {"page": 1, "search": "Người xem"}))
        assert [item["code"] for item in items] == ["VIEWER"]

        items, _ = self.assert_paginated(
            api.get(ROLES, {"page": 1, "auto_grant": "all,read_only", "is_system": "true"})
        )
        assert {item["code"] for item in items} >= {"ADMIN", "VIEWER"}
        assert all(item["auto_grant"] in {"all", "read_only"} for item in items)

    def test_invalid_filter_value_rejected(self, superuser: User, login: Any) -> None:
        error = self.assert_error(
            login(superuser).get(ROLES, {"auto_grant": "maybe"}), 400, "VALIDATION_ERROR"
        )
        assert "auto_grant" in error["details"]

    def test_assign_and_revoke_permission(self, superuser: User, login: Any) -> None:
        api = login(superuser)
        role = RoleFactory()
        permission = Permission.objects.get(code=A.USER_READ.code)
        data = self.assert_success(
            api.post(f"{ROLES}/{role.pk}/permissions", {"permission_id": str(permission.pk)}, format="json")
        )
        assert [item["code"] for item in data["permissions"]] == [A.USER_READ.code]
        assert data["permission_count"] == 1
        assert api.delete(f"{ROLES}/{role.pk}/permissions/{permission.pk}").status_code == 204
        self.assert_error(api.delete(f"{ROLES}/{role.pk}/permissions/{permission.pk}"), 404)

    def test_cannot_grant_permission_not_held(self, staff_with: Any, login: Any) -> None:
        member = staff_with(P.PERMISSION_ASSIGN)
        role = RoleFactory()
        permission = Permission.objects.get(code=A.USER_CREATE.code)
        response = login(member).post(
            f"{ROLES}/{role.pk}/permissions", {"permission_id": str(permission.pk)}, format="json"
        )
        self.assert_forbidden(response, "IAM_PRIVILEGE_ESCALATION")

    def test_system_role_protected_for_non_superuser(self, staff_with: Any, login: Any) -> None:
        member = staff_with(P.ROLE_UPDATE)
        viewer = Role.objects.get(code="VIEWER")
        response = login(member).patch(f"{ROLES}/{viewer.pk}", {"name": "x"}, format="json")
        self.assert_forbidden(response, "IAM_SYSTEM_ROLE_PROTECTED")

    def test_list_permissions(self, staff_with: Any, login: Any) -> None:
        member = staff_with(P.PERMISSION_READ)
        data = self.assert_success(login(member).get("/api/v1/iam/permissions", {"module": "iam"}))
        codes = [item["code"] for item in data]
        assert P.ROLE_READ.code in codes and all(code.startswith("iam.") for code in codes)
