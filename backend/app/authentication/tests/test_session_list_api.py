"""Kiểm thử endpoint danh sách phiên cá nhân: GET /api/v1/auth/sessions."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase

pytestmark = pytest.mark.django_db
URL = "/api/v1/auth/sessions"


class TestSessionListApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint GET /api/v1/auth/sessions."""

    def test_list_sessions_success(self, user: Any, login: Any) -> None:
        """Lấy danh sách các phiên đang hoạt động của người dùng hiện tại."""
        first, _ = login(user), login(user)
        sessions = self.assert_success(first.get(URL))
        assert len(sessions) == 2
        assert sum(1 for item in sessions if item["is_current"]) == 1

    def test_list_sessions_unauthenticated(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)
