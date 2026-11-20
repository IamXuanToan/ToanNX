"""`?search=` không dấu: "nguyen" khớp "Nguyễn", "duc" khớp "Đức", cả qua quan hệ (`user__email`)."""

from typing import Any

import pytest
from django.db import connection

from app.account.models.user import User
from app.account.tests.factories.user_factory import UserFactory
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.core.utils.text import ascii_slug, to_ascii
from app.iam.tests.factories.role_factory import RoleFactory

pytestmark = pytest.mark.django_db

USERS = "/api/v1/account/users"


# Toàn bộ nguyên âm tiếng Việt (12 nguyên âm × 6 thanh, hoa + thường) và đ/Đ.
VOWELS = {
    "a": "aàáảãạ",
    "ă": "ăằắẳẵặ",
    "â": "âầấẩẫậ",
    "e": "eèéẻẽẹ",
    "ê": "êềếểễệ",
    "i": "iìíỉĩị",
    "o": "oòóỏõọ",
    "ô": "ôồốổỗộ",
    "ơ": "ơờớởỡợ",
    "u": "uùúủũụ",
    "ư": "ưừứửữự",
    "y": "yỳýỷỹỵ",
}
BASE = {"ă": "a", "â": "a", "ê": "e", "ô": "o", "ơ": "o", "ư": "u"}
ALL_VIETNAMESE = "".join(VOWELS.values()) + "đ"


def test_to_ascii_covers_every_vietnamese_letter() -> None:
    for vowel, forms in VOWELS.items():
        expected = BASE.get(vowel, vowel)
        assert to_ascii(forms) == expected * len(forms), vowel
        assert to_ascii(forms.upper()) == expected.upper() * len(forms), vowel
    assert to_ascii("đĐ") == "dD"
    assert to_ascii("Nguyễn Đức Ước") == "Nguyen Duc Uoc"


def test_ascii_slug_keeps_d() -> None:
    assert ascii_slug("Ủng hộ Đức") == "ung-ho-duc"  # slugify của Django bỏ mất "Đ"


def test_postgres_unaccent_matches_library_for_vietnamese() -> None:
    """Tìm kiếm dùng `unaccent` của PostgreSQL: kết quả phải khớp thư viện cho mọi chữ tiếng Việt."""
    with connection.cursor() as cursor:
        cursor.execute("SELECT unaccent(%s), unaccent(upper(%s))", [ALL_VIETNAMESE, ALL_VIETNAMESE])
        lower, upper = cursor.fetchone()
    assert lower == to_ascii(ALL_VIETNAMESE)
    assert upper == to_ascii(ALL_VIETNAMESE.upper())


class TestAccentInsensitiveSearch(BaseApiTestCase):
    """Tìm không phân biệt dấu trên mọi bảng dùng `CoreSearchFilter`."""

    @pytest.mark.parametrize("term", ["nguyen", "Nguyễn", "NGUYEN", "duc", "Đức"])
    def test_user_search_ignores_accents(self, superuser: User, login: Any, term: str) -> None:
        target = UserFactory(first_name="Đức", last_name="Nguyễn")
        data = self.assert_success(login(superuser).get(USERS, {"search": term}))
        assert str(target.pk) in {item["id"] for item in data}

    @pytest.mark.parametrize("term", ["huong", "HƯỞNG", "hướng", "Huơng"])
    def test_stacked_diacritics(self, superuser: User, login: Any, term: str) -> None:
        target = UserFactory(first_name="Hưởng", last_name="Trần")
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
