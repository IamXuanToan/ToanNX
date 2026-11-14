"""Test is_staff và quyền theo phương thức (AdminApiView)."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.account.permissions.account_permission import AccountPermission as A
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db

USERS = "/api/v1/account/users"


class TestAdminAccess(BaseApiTestCase):
    """Bảo vệ khu vực quản trị."""

    def test_non_staff_denied(self, user: User, login: Any) -> None:
        grant(user, A.USER_READ)
        self.assert_forbidden(login(user).get(USERS), "ADMIN_ACCESS_REQUIRED")

    def test_staff_without_permission_denied(self, staff: User, login: Any) -> None:
        error = self.assert_error(login(staff).get(USERS), 403, "PERMISSION_DENIED")
        assert error["details"]["permissions"] == [A.USER_READ.code]

    def test_staff_with_permission_allowed(self, staff_with: Any, login: Any) -> None:
        member = staff_with(A.USER_READ)
        items, pagination = self.assert_paginated(login(member).get(USERS))
        assert pagination["total"] >= 1
        assert any(item["email"] == member.email for item in items)

    def test_superuser_access(self, superuser: User, login: Any) -> None:
        self.assert_paginated(login(superuser).get(USERS))

    def test_unauthenticated(self, client: Any) -> None:
        self.assert_unauthorized(client.get(USERS))

    def test_method_without_mapping_denied(self, staff_with: Any, login: Any) -> None:
        member = staff_with(A.USER_READ)
        response = login(member).delete(f"{USERS}/{member.pk}")
        assert response.status_code in (403, 405)
