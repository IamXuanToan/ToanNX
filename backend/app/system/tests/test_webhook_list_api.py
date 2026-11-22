"""Test GET /api/v1/system/webhooks."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/webhooks"


class TestWebhookListApi(BaseApiTestCase):
    """Danh mục webhook các module khai báo."""

    def test_lists_sepay_with_backend_host(self, superuser: Any, login: Any, settings: Any) -> None:
        """URL dựng theo Host backend thật, không theo domain FE đã proxy (X-Forwarded-Host)."""
        settings.ALLOWED_HOSTS = ["testserver", "toannx.com"]
        api = login(superuser)
        data = self.assert_success(api.get(URL, HTTP_X_FORWARDED_HOST="toannx.com"))
        sepay = next(item for item in data if item["code"] == "finance.sepay")
        assert sepay["url"] == "http://testserver/api/v1/finance/sepay/webhook/{public_id}"
        assert sepay["method"] == "POST" and sepay["setup"] and "HMAC" in sepay["auth"]

    def test_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Thiếu quyền → 403."""
        self.assert_forbidden(login(user).get(URL))

    def test_unauthenticated(self, client: Any) -> None:
        """Chưa đăng nhập → 401."""
        self.assert_unauthorized(client.get(URL))
