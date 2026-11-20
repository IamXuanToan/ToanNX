"""Quyền API chỉ theo IAM (`HasIamPermission`); `is_staff` không ảnh hưởng API."""

from typing import Any

import pytest

from app.account.models.user import User
from app.account.permissions.user_permission import UserPermission as A
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db

USERS = "/api/v1/account/users"


class TestIamAccess(BaseApiTestCase):
    """Mặc định DENY, quyền IAM quyết định, superuser qua."""

    def test_non_staff_with_permission_allowed(self, user: User, login: Any) -> None:
        grant(user, A.USER_READ)
        self.assert_paginated(login(user).get(USERS, {"page": 1}))

    def test_staff_without_permission_denied(self, staff: User, login: Any) -> None:
        error = self.assert_error(login(staff).get(USERS), 403, "PERMISSION_DENIED")
        assert error["details"]["permissions"] == [A.USER_READ.code]

    def test_staff_with_permission_allowed(self, staff_with: Any, login: Any) -> None:
        member = staff_with(A.USER_READ)
        items, pagination = self.assert_paginated(login(member).get(USERS, {"page": 1}))
        assert pagination["total"] >= 1
        assert any(item["email"] == member.email for item in items)

    def test_superuser_access(self, superuser: User, login: Any) -> None:
        self.assert_success(login(superuser).get(USERS))

    def test_unauthenticated(self, client: Any) -> None:
        self.assert_unauthorized(client.get(USERS))

    def test_action_without_rule_denied(self, staff_with: Any, login: Any) -> None:
        """Action không khai trong `action_permissions` bị từ chối dù có quyền khác."""
        member = staff_with(A.USER_READ)
        response = login(member).delete(f"{USERS}/{member.pk}")
        assert response.status_code == 403

    def test_list_without_page_returns_all(self, superuser: User, login: Any) -> None:
        """Không truyền `page`/`page_size` thì trả hết, không có `meta.pagination`."""
        response = login(superuser).get(USERS)
        body = response.json()
        assert response.status_code == 200
        assert "pagination" not in body["meta"]
        assert isinstance(body["data"], list)
