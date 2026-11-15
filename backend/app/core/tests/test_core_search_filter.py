"""`?search=` không dấu: "nguyen" khớp "Nguyễn", "duc" khớp "Đức", cả qua quan hệ (`user__email`)."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.core.utils.text import strip_accents
from app.modules.account.models.user import User
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.iam.tests.factories.role_factory import RoleFactory

pytestmark = pytest.mark.django_db

USERS = "/api/v1/account/users"


def test_strip_accents() -> None:
    assert strip_accents("Nguyễn Đức Ước") == "Nguyen Duc Uoc"
    assert strip_accents("ABC-123") == "ABC-123"


class TestAccentInsensitiveSearch(BaseApiTestCase):
    """Tìm không phân biệt dấu trên mọi bảng dùng `CoreSearchFilter`."""

    @pytest.mark.parametrize("term", ["nguyen", "Nguyễn", "NGUYEN", "duc", "Đức"])
    def test_user_search_ignores_accents(self, superuser: User, login: Any, term: str) -> None:
        target = UserFactory(first_name="Đức", last_name="Nguyễn")
        data = self.assert_success(login(superuser).get(USERS, {"search": term}))
        assert str(target.pk) in {item["id"] for item in data}

    def test_accented_term_matches_plain_value(self, superuser: User, login: Any) -> None:
        role = RoleFactory(name="Quan tri noi dung")
        data = self.assert_success(login(superuser).get("/api/v1/iam/roles", {"search": "quản trị"}))
        assert str(role.pk) in {item["id"] for item in data}

    def test_search_through_relation(self, superuser: User, login: Any) -> None:
        owner = UserFactory(first_name="Thảo", last_name="Lê")
        login(owner)
        data = self.assert_success(login(superuser).get("/api/v1/auth/admin-sessions", {"search": "thao"}))
        assert any(item["user_id"] == str(owner.pk) for item in data)

    def test_non_matching_term_returns_nothing(self, superuser: User, login: Any) -> None:
        UserFactory(first_name="Đức", last_name="Nguyễn")
        data = self.assert_success(login(superuser).get(USERS, {"search": "khongtontai"}))
        assert data == []
