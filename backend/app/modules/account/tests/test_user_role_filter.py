"""Lọc người dùng theo vai trò với phân trang và tìm kiếm thật."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.permissions.account_permission import AccountPermission
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.iam.models.user_role import UserRole
from app.modules.iam.tests.factories.role_factory import RoleFactory
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db


class TestUserRoleFilter(BaseApiTestCase):
    """Vai trò là điều kiện trên toàn bộ queryset, không lọc trên một trang FE."""

    def test_combines_role_search_and_status(self, staff: Any, login: Any) -> None:
        grant(staff, AccountPermission.USER_READ)
        role = RoleFactory()
        user = UserFactory(email="role-filter@example.com")
        other = UserFactory()
        UserRole.objects.create(user=user, role=role)
        UserRole.objects.create(user=other, role=role)
        api = login(staff)
        items, meta = self.assert_paginated(
            api.get("/api/v1/account/users", {"role": role.pk, "search": user.email, "is_active": "true"})
        )
        assert meta["total"] == 1
        assert items[0]["id"] == str(user.pk)
        self.assert_error(api.get("/api/v1/account/users", {"role": "invalid"}), 400, "VALIDATION_ERROR")

    def test_multiple_values_per_filter(self, staff: Any, login: Any) -> None:
        grant(staff, AccountPermission.USER_READ)
        first, second = RoleFactory(), RoleFactory()
        a = UserFactory(email="multi-a@example.com")
        b = UserFactory(email="multi-b@example.com", is_active=False)
        UserFactory(email="multi-c@example.com")
        UserRole.objects.create(user=a, role=first)
        UserRole.objects.create(user=b, role=second)
        UserRole.objects.create(user=b, role=first)
        api = login(staff)
        items, meta = self.assert_paginated(
            api.get("/api/v1/account/users", {"role": f"{first.pk},{second.pk}", "search": "multi-"})
        )
        assert meta["total"] == 2
        assert {item["id"] for item in items} == {str(a.pk), str(b.pk)}
        _, meta = self.assert_paginated(
            api.get("/api/v1/account/users", {"is_active": "true,false", "search": "multi-"})
        )
        assert meta["total"] == 3
        _, meta = self.assert_paginated(
            api.get("/api/v1/account/users", {"is_active": "false", "search": "multi-"})
        )
        assert meta["total"] == 1

    def test_access_filter_matches_any_selected(self, staff: Any, login: Any) -> None:
        grant(staff, AccountPermission.USER_READ)
        UserFactory(email="acc-staff@example.com", is_staff=True)
        UserFactory(email="acc-novel@example.com", is_novel=True)
        UserFactory(email="acc-plain@example.com")
        api = login(staff)
        items, _ = self.assert_paginated(
            api.get("/api/v1/account/users", {"access": "staff,novel", "search": "acc-"})
        )
        assert {item["email"] for item in items} == {"acc-staff@example.com", "acc-novel@example.com"}
        self.assert_error(api.get("/api/v1/account/users", {"access": "root"}), 400, "VALIDATION_ERROR")
