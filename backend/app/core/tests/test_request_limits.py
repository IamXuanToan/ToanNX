"""Giới hạn chung: phân trang tùy chọn, độ dài tìm kiếm, số giá trị bộ lọc, rate limit khai báo."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.models.user import User

pytestmark = pytest.mark.django_db

USERS = "/api/v1/account/users"
ROLES = "/api/v1/iam/roles"


class TestRequestLimits(BaseApiTestCase):
    """Chặn request quá lớn ở tầng core."""

    def test_pagination_only_when_requested(self, superuser: User, login: Any) -> None:
        api = login(superuser)
        assert "pagination" not in api.get(ROLES).json()["meta"]
        _, pagination = self.assert_paginated(api.get(ROLES, {"page_size": 1}))
        assert pagination["page_size"] == 1
        _, pagination = self.assert_paginated(api.get(ROLES, {"page_size": 1000}))
        assert pagination["page_size"] == 100

    def test_search_too_long_rejected(self, superuser: User, login: Any) -> None:
        api = login(superuser)
        self.assert_error(api.get(USERS, {"search": "x" * 101}), 400, "VALIDATION_ERROR")
        self.assert_error(api.get(USERS, {"search": "a b c d e f"}), 400, "VALIDATION_ERROR")
        self.assert_success(api.get(USERS, {"search": "a b c d e"}))

    def test_too_many_filter_values_rejected(self, superuser: User, login: Any) -> None:
        api = login(superuser)
        values = ",".join(["true"] * 51)
        self.assert_error(api.get(USERS, {"is_active": values}), 400, "VALIDATION_ERROR")

    def test_default_write_rate_limit(self, superuser: User, login: Any, settings: Any) -> None:
        settings.RATE_LIMITS = {**settings.RATE_LIMITS, "default.write": (1, 60, "user")}
        api = login(superuser)
        self.assert_success(api.post(ROLES, {"code": "RL_ONE", "name": "1"}, format="json"), 201)
        response = api.post(ROLES, {"code": "RL_TWO", "name": "2"}, format="json")
        self.assert_error(response, 429, "RATE_LIMITED")
        assert int(response["Retry-After"]) >= 1
