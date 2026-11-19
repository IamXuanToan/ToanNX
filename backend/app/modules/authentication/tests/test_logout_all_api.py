"""Kiểm thử endpoint đăng xuất toàn bộ phiên: POST /api/v1/auth/logout-all."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase

pytestmark = pytest.mark.django_db
URL = "/api/v1/auth/logout-all"


class TestLogoutAllApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/auth/logout-all."""

    def test_logout_all_success(self, user: Any, login: Any) -> None:
        """Đăng xuất toàn bộ phiên thu hồi tất cả phiên của người dùng."""
        first, second = login(user), login(user)
        data = self.assert_success(first.post(URL))
        assert data["revoked_sessions"] == 2
        self.assert_unauthorized(second.get("/api/v1/auth/me"), "AUTH_SESSION_INVALID")

    def test_logout_all_unauthenticated(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401 khi gọi logout-all."""
        response = client.post(URL)
        self.assert_unauthorized(response)
