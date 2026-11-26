"""Kiểm thử endpoint danh sách cấu hình hệ thống: GET /api/v1/system/settings."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.user import User

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/settings"


class TestSettingListApi(BaseApiTestCase):
    """Kiểm thử GET /api/v1/system/settings."""

    def test_list_settings_success(self, superuser: User, login: Any) -> None:
        """Superuser xem danh sách cấu hình thành công."""
        res = login(superuser).get(f"{URL}?page=1")
        items, meta = self.assert_paginated(res)
        assert len(items) >= 2
        keys = [item["key"] for item in items]
        assert "auth_google_enabled" in keys
        assert "auth_github_enabled" in keys

    def test_filter_settings_by_category(self, superuser: User, login: Any) -> None:
        """Lọc cấu hình theo nhóm (`category=auth`, `category=assistant`) và `is_public`."""
        client = login(superuser)
        res = client.get(f"{URL}?page=1&category=auth")
        items, _ = self.assert_paginated(res)
        assert len(items) >= 2
        assert all(item["category"] == "auth" for item in items)

        res_assistant = client.get(f"{URL}?page=1&category=assistant&is_public=false")
        assistant_items, _ = self.assert_paginated(res_assistant)
        assert any(item["key"] == "workspace_assistant_config" for item in assistant_items)
        assert all(item["category"] == "assistant" and item["is_public"] is False for item in assistant_items)

    def test_list_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.get(URL)
        self.assert_unauthorized(res)

    def test_list_forbidden_without_permission(self, user: User, login: Any) -> None:
        """Người dùng thường thiếu quyền system.setting.read bị 403."""
        res = login(user).get(URL)
        self.assert_forbidden(res)
