"""Test GET /api/v1/system/callbacks."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/callbacks"


class TestCallbackListApi(BaseApiTestCase):
    """URL callback OAuth theo origin FE đang dùng."""

    def test_lists_google_github_with_frontend_origin(
        self, superuser: Any, login: Any, settings: Any
    ) -> None:
        """Origin lấy từ request (Referer của trang FE nằm trong allowlist), không hardcode domain."""
        settings.GOOGLE_OAUTH_CLIENT_ID = "id"
        settings.GITHUB_OAUTH_CLIENT_ID = ""
        settings.CORS_ALLOWED_ORIGINS = ["https://site-khac.test"]
        api = login(superuser)
        data = self.assert_success(
            api.get(URL, HTTP_REFERER="https://site-khac.test/vi/quan-tri/he-thong/callback")
        )
        by_code = {item["code"]: item for item in data}
        assert by_code["system.google_oauth"]["url"] == "https://site-khac.test/auth/callback/google"
        assert by_code["system.github_oauth"]["url"] == "https://site-khac.test/auth/callback/github"
        assert by_code["system.google_oauth"]["configured"] is True
        assert by_code["system.github_oauth"]["configured"] is False

    def test_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Thiếu quyền → 403."""
        self.assert_forbidden(login(user).get(URL))

    def test_unauthenticated(self, client: Any) -> None:
        """Chưa đăng nhập → 401."""
        self.assert_unauthorized(client.get(URL))
