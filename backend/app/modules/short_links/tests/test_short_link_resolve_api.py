"""Kiểm thử endpoint công khai resolve short link: GET/POST /api/v1/short_links/resolve/{slug}."""

from datetime import timedelta
from typing import Any

import pytest
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.short_links.models.short_link import ShortLink
from app.modules.short_links.tests.factories.short_link_factory import ShortLinkFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/short_links/resolve"


class TestShortLinkResolveApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint resolve short link công khai."""

    def test_resolve_public_success_and_headers(self, client: Any) -> None:
        """Khách vãng lai resolve link công khai thành công kèm headers bảo mật chống index."""
        link = ShortLinkFactory(
            slug="my-public-link",
            destination_url="https://example.com/target",
            auto_redirect_seconds=3,
        )

        res = client.get(f"{BASE_URL}/{link.slug}")
        assert res.status_code == 200
        assert res["Cache-Control"] == "no-store"
        assert res["X-Robots-Tag"] == "noindex"

        data = self.assert_success(res, 200)
        assert data["destination_url"] == "https://example.com/target"
        assert data["auto_redirect_seconds"] == 3
        assert data["has_password"] is False

    def test_resolve_password_protected_and_unlock(self, client: Any) -> None:
        """Link có mật khẩu sẽ ẩn destination_url ở GET; POST đúng mật khẩu mới mở khóa."""
        from django.contrib.auth.hashers import make_password

        link = ShortLinkFactory(
            slug="locked-link",
            destination_url="https://secret.example.com",
            password_hash=make_password("mypassword"),
        )

        # 1. GET công khai: destination_url bị ẩn (None), has_password = True
        res_get = client.get(f"{BASE_URL}/{link.slug}")
        data_get = self.assert_success(res_get, 200)
        assert data_get["destination_url"] is None
        assert data_get["has_password"] is True

        # 2. POST sai mật khẩu bị 403 SHORT_LINK_INVALID_PASSWORD
        res_wrong = client.post(f"{BASE_URL}/{link.slug}", {"password": "wrong"}, format="json")
        self.assert_error(res_wrong, 403, "SHORT_LINK_INVALID_PASSWORD")

        # 3. POST đúng mật khẩu trả về destination_url
        res_right = client.post(f"{BASE_URL}/{link.slug}", {"password": "mypassword"}, format="json")
        data_right = self.assert_success(res_right, 200)
        assert data_right["destination_url"] == "https://secret.example.com"

    def test_resolve_inactive_link_returns_404(self, client: Any) -> None:
        """Link đang tạm tắt (INACTIVE) trả về 404 NOT_FOUND."""
        link = ShortLinkFactory(slug="inactive-link", status=ShortLink.Status.INACTIVE)
        res = client.get(f"{BASE_URL}/{link.slug}")
        self.assert_error(res, 404, "NOT_FOUND")

    def test_resolve_expired_link_returns_410(self, client: Any) -> None:
        """Link đã quá hạn (expires_at trong quá khứ) trả về 410 SHORT_LINK_EXPIRED."""
        link = ShortLinkFactory(
            slug="expired-link",
            expires_at=timezone.now() - timedelta(seconds=10),
        )
        res = client.get(f"{BASE_URL}/{link.slug}")
        self.assert_error(res, 410, "SHORT_LINK_EXPIRED")

    def test_resolve_not_found(self, client: Any) -> None:
        """Slug không tồn tại hoặc sai định dạng trả về 404 NOT_FOUND."""
        res1 = client.get(f"{BASE_URL}/non-existent-slug")
        self.assert_error(res1, 404, "NOT_FOUND")

        res2 = client.get(f"{BASE_URL}/A_B")
        self.assert_error(res2, 404, "NOT_FOUND")
