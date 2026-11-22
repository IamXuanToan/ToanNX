"""Kiểm thử endpoint đăng xuất: POST /api/v1/system/auth/logout."""

from typing import Any

import pytest
from django.conf import settings

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.auth_session import AuthSession

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/auth/logout"


class TestLogoutApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/system/auth/logout."""

    def test_logout_revokes_session_and_clears_cookies(self, user: Any, login: Any) -> None:
        """Đăng xuất thành công thu hồi phiên và xóa sạch các auth cookie."""
        api = login(user)
        response = api.post(URL)
        self.assert_success(response)

        for name in (
            settings.AUTH_ACCESS_COOKIE_NAME,
            settings.AUTH_REFRESH_COOKIE_NAME,
            settings.AUTH_SESSION_HINT_COOKIE_NAME,
        ):
            assert response.cookies[name].value == ""

        assert AuthSession.objects.get(user=user).revoked_reason == "logout"
        self.assert_unauthorized(api.post("/api/v1/system/auth/refresh"))

    def test_logout_unauthenticated(self, client: Any) -> None:
        """Khách chưa đăng nhập gọi logout vẫn trả về phản hồi hợp lệ (idempotent / clear cookie)."""
        response = client.post(URL)
        assert response.status_code in (200, 204)
