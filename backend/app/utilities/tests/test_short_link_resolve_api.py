"""Kiểm thử endpoint công khai resolve short link: GET/POST /api/v1/utilities/short-links/resolve/{slug}."""

from datetime import timedelta
from typing import Any

import pytest
from django.contrib.auth.hashers import make_password
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.core.tests.helpers.fake_redis import FakeRedis
from app.utilities.models.short_link import ShortLink
from app.utilities.services.short_link_service import ShortLinkService
from app.utilities.tests.factories.short_link_factory import ShortLinkFactory

pytestmark = pytest.mark.django_db
BASE_URL = "/api/v1/utilities/short-links/resolve"


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

        # 2. POST sai mật khẩu bị 403 UTILITIES_SHORT_LINK_INVALID_PASSWORD
        res_wrong = client.post(f"{BASE_URL}/{link.slug}", {"password": "wrong"}, format="json")
        self.assert_error(res_wrong, 403, "UTILITIES_SHORT_LINK_INVALID_PASSWORD")

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
        """Link đã quá hạn (expires_at trong quá khứ) trả về 410 UTILITIES_SHORT_LINK_EXPIRED."""
        link = ShortLinkFactory(
            slug="expired-link",
            expires_at=timezone.now() - timedelta(seconds=10),
        )
        res = client.get(f"{BASE_URL}/{link.slug}")
        self.assert_error(res, 410, "UTILITIES_SHORT_LINK_EXPIRED")

    def test_resolve_not_found(self, client: Any) -> None:
        """Slug không tồn tại hoặc sai định dạng trả về 404 NOT_FOUND."""
        res1 = client.get(f"{BASE_URL}/non-existent-slug")
        self.assert_error(res1, 404, "NOT_FOUND")

        res2 = client.get(f"{BASE_URL}/A_B")
        self.assert_error(res2, 404, "NOT_FOUND")


class TestShortLinkResolveCache(BaseApiTestCase):
    """Có Redis: lượt khách lặp lại không chạm DB; sửa link thì cache hết hiệu lực ngay."""

    def test_second_visit_hits_cache_without_db(
        self, client: Any, fake_redis: FakeRedis, django_assert_num_queries: Any
    ) -> None:
        link = ShortLinkFactory(slug="cached-link", destination_url="https://example.com/a")
        assert client.get(f"{BASE_URL}/{link.slug}").status_code == 200
        with django_assert_num_queries(0):
            res = client.get(f"{BASE_URL}/{link.slug}")
        assert self.assert_success(res, 200)["destination_url"] == "https://example.com/a"

    def test_update_invalidates_cache(
        self,
        client: Any,
        superuser: Any,
        login: Any,
        fake_redis: FakeRedis,
        django_capture_on_commit_callbacks: Any,
    ) -> None:
        link = ShortLinkFactory(slug="edit-me", destination_url="https://example.com/a", owner=superuser)
        client.get(f"{BASE_URL}/{link.slug}")
        with django_capture_on_commit_callbacks(execute=True):
            ShortLinkService().update(superuser, link.pk, {"destination_url": "https://example.com/b"})
        data = self.assert_success(client.get(f"{BASE_URL}/{link.slug}"), 200)
        assert data["destination_url"] == "https://example.com/b"

    def test_locked_link_cache_has_no_hash_or_destination(self, client: Any, fake_redis: FakeRedis) -> None:
        link = ShortLinkFactory(
            slug="locked", destination_url="https://example.com/secret", password_hash=make_password("pw")
        )
        client.get(f"{BASE_URL}/{link.slug}")
        stored = " ".join(fake_redis.data.values())
        assert "secret" not in stored and "pbkdf2" not in stored and "argon2" not in stored
        data = self.assert_success(client.get(f"{BASE_URL}/{link.slug}"), 200)
        assert data["has_password"] is True and data["destination_url"] is None
        # Mở khóa luôn kiểm ở DB.
        res = client.post(f"{BASE_URL}/{link.slug}", {"password": "pw"}, format="json")
        assert self.assert_success(res, 200)["destination_url"] == "https://example.com/secret"
        bad = client.post(f"{BASE_URL}/{link.slug}", {"password": "sai"}, format="json")
        assert bad.status_code != 200

    def test_missing_slug_cached_briefly(
        self, client: Any, fake_redis: FakeRedis, django_assert_num_queries: Any
    ) -> None:
        assert client.get(f"{BASE_URL}/khong-co").status_code == 404
        with django_assert_num_queries(0):
            assert client.get(f"{BASE_URL}/khong-co").status_code == 404
