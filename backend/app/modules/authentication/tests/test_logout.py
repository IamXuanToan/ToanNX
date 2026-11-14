"""Test POST /auth/logout, /auth/logout-all."""

from typing import Any

import pytest
from django.conf import settings

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.authentication.models.auth_session import AuthSession

pytestmark = pytest.mark.django_db


class TestLogout(BaseApiTestCase):
    """Đăng xuất."""

    def test_logout_revokes_session_and_clears_cookies(self, user: Any, login: Any) -> None:
        api = login(user)
        response = api.post("/api/v1/auth/logout")
        self.assert_success(response)
        for name in (
            settings.AUTH_ACCESS_COOKIE_NAME,
            settings.AUTH_REFRESH_COOKIE_NAME,
            settings.AUTH_SESSION_HINT_COOKIE_NAME,
        ):
            assert response.cookies[name].value == ""
        assert AuthSession.objects.get(user=user).revoked_reason == "logout"
        self.assert_unauthorized(api.post("/api/v1/auth/refresh"))

    def test_logout_all(self, user: Any, login: Any) -> None:
        first, second = login(user), login(user)
        data = self.assert_success(first.post("/api/v1/auth/logout-all"))
        assert data["revoked_sessions"] == 2
        self.assert_unauthorized(second.get("/api/v1/auth/me"), "AUTH_SESSION_INVALID")
