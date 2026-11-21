"""Kiểm thử endpoint cấu hình công khai: GET /api/v1/system/settings/public."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/settings/public"


class TestPublicSettingApi(BaseApiTestCase):
    """Kiểm thử GET /api/v1/system/settings/public."""

    def test_get_public_settings_unauthenticated_allowed(self, client: Any) -> None:
        """Khách chưa đăng nhập vẫn đọc được cấu hình công khai (200)."""
        res = client.get(URL)
        data = self.assert_success(res, 200)
        assert "auth_google_enabled" in data
        assert "auth_github_enabled" in data
        assert data["auth_google_enabled"] is True
        assert data["auth_github_enabled"] is True
