"""Test /iam/users và các quy tắc bảo vệ người dùng."""

from typing import Any

import pytest
from django.contrib.auth.hashers import identify_hasher

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User
from app.modules.account.permissions.account_permission import AccountPermission as A
from app.modules.account.tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.django_db

USERS = "/api/v1/account/users"


class TestUserApi(BaseApiTestCase):
    """CRUD người dùng."""

    def test_create_user(self, superuser: User, login: Any) -> None:
        payload = {"email": "New@Toannx.test", "password": "V3ry-Str0ng-Pass", "first_name": "An"}
        response = login(superuser).post(USERS, payload, format="json")
        data = self.assert_success(response, 201)
        self.assert_no_sensitive_data(response)
        assert data["email"] == "new@toannx.test"
        created = User.objects.get(email="new@toannx.test")
        assert created.created_by_id == superuser.pk
        assert identify_hasher(created.password)

    def test_create_duplicate_email(self, superuser: User, user: User, login: Any) -> None:
        payload = {"email": user.email.upper(), "password": "V3ry-Str0ng-Pass"}
        self.assert_error(login(superuser).post(USERS, payload, format="json"), 409, "ACCOUNT_EMAIL_EXISTS")

    def test_create_weak_password(self, superuser: User, login: Any) -> None:
        payload = {"email": "weak@toannx.test", "password": "12345678"}
        self.assert_error(login(superuser).post(USERS, payload, format="json"), 400, "ACCOUNT_PASSWORD_WEAK")

    def test_unknown_field_rejected(self, superuser: User, login: Any) -> None:
        payload = {"email": "x@toannx.test", "password": "V3ry-Str0ng-Pass", "role": "ADMIN"}
        error = self.assert_error(
            login(superuser).post(USERS, payload, format="json"), 400, "VALIDATION_ERROR"
        )
        assert "role" in error["details"]

    def test_update_user(self, superuser: User, user: User, login: Any) -> None:
        data = self.assert_success(
            login(superuser).patch(f"{USERS}/{user.pk}", {"first_name": "Bình"}, format="json")
        )
        assert data["first_name"] == "Bình"
        user.refresh_from_db()
        assert user.updated_by_id == superuser.pk

    def test_not_found(self, superuser: User, login: Any) -> None:
        self.assert_error(
            login(superuser).get(f"{USERS}/00000000-0000-0000-0000-000000000000"), 404, "NOT_FOUND"
        )

    def test_list_search_filter_ordering_pagination(self, superuser: User, login: Any) -> None:
        api = login(superuser)
        UserFactory(email="findme-a@toannx.test", is_staff=True)
        UserFactory(email="findme-b@toannx.test", is_active=False)

        items, _ = self.assert_paginated(api.get(USERS, {"search": "findme", "ordering": "-email"}))
        assert [item["email"] for item in items] == ["findme-b@toannx.test", "findme-a@toannx.test"]

        items, _ = self.assert_paginated(api.get(USERS, {"search": "findme", "is_active": "false"}))
        assert [item["email"] for item in items] == ["findme-b@toannx.test"]

        items, pagination = self.assert_paginated(api.get(USERS, {"page_size": 1}))
        assert len(items) == 1 and pagination["page_size"] == 1 and pagination["total_pages"] >= 3

    def test_page_out_of_range(self, superuser: User, login: Any) -> None:
        self.assert_error(login(superuser).get(USERS, {"page": 999}), 404, "NOT_FOUND")

    def test_ordering_outside_whitelist_ignored(self, superuser: User, login: Any) -> None:
        self.assert_paginated(login(superuser).get(USERS, {"ordering": "password"}))


class TestSelfProtection(BaseApiTestCase):
    """Chống tự nâng quyền và bảo vệ superuser."""

    def test_staff_cannot_create_superuser(self, staff_with: Any, login: Any) -> None:
        member = staff_with(A.USER_CREATE)
        payload = {"email": "su@toannx.test", "password": "V3ry-Str0ng-Pass", "is_superuser": True}
        self.assert_forbidden(
            login(member).post(USERS, payload, format="json"), "ACCOUNT_PRIVILEGE_ESCALATION"
        )

    def test_staff_cannot_escalate_self(self, staff_with: Any, login: Any) -> None:
        member = staff_with(A.USER_UPDATE)
        response = login(member).patch(f"{USERS}/{member.pk}", {"is_superuser": True}, format="json")
        self.assert_forbidden(response, "ACCOUNT_SELF_MODIFICATION")

    def test_staff_cannot_grant_superuser_to_others(self, staff_with: Any, user: User, login: Any) -> None:
        member = staff_with(A.USER_UPDATE)
        response = login(member).patch(f"{USERS}/{user.pk}", {"is_superuser": True}, format="json")
        self.assert_forbidden(response, "ACCOUNT_PRIVILEGE_ESCALATION")

    def test_staff_cannot_edit_superuser(self, staff_with: Any, superuser: User, login: Any) -> None:
        member = staff_with(A.USER_UPDATE)
        response = login(member).patch(f"{USERS}/{superuser.pk}", {"first_name": "x"}, format="json")
        self.assert_forbidden(response, "ACCOUNT_SUPERUSER_PROTECTED")

    def test_last_superuser_cannot_be_deactivated(self, superuser: User, login: Any) -> None:
        response = login(superuser).patch(f"{USERS}/{superuser.pk}", {"is_active": False}, format="json")
        self.assert_error(response, 422, "ACCOUNT_LAST_SUPERUSER")

    def test_last_superuser_cannot_be_demoted(self, superuser: User, login: Any) -> None:
        response = login(superuser).patch(f"{USERS}/{superuser.pk}", {"is_superuser": False}, format="json")
        self.assert_error(response, 422, "ACCOUNT_LAST_SUPERUSER")

    def test_superuser_can_be_demoted_when_another_exists(self, superuser: User, login: Any) -> None:
        other = UserFactory(is_superuser=True, is_staff=True)
        data = self.assert_success(
            login(superuser).patch(f"{USERS}/{other.pk}", {"is_superuser": False}, format="json")
        )
        assert data["is_superuser"] is False
