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

        res = client.get(
            f"{BASE_URL}/{link.slug}",
            HTTP_USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            REMOTE_ADDR="198.51.100.1",
        )
        assert res.status_code == 200
        assert res["Cache-Control"] == "no-store"
        assert res["X-Robots-Tag"] == "noindex"

        data = self.assert_success(res, 200)
        assert data["destination_url"] == "https://example.com/target"
        assert data["auto_redirect_seconds"] == 3
        assert data["has_password"] is False

        link.refresh_from_db()
        assert link.clicks_count == 1
        assert link.visitors_count == 1
        assert link.last_accessed_at is not None

    def test_resolve_two_different_visitors_increments_both(self, client: Any) -> None:
        """2 người khác nhau cùng vào link thì cộng đủ cả 2 người vào và 2 lượt click."""
        link = ShortLinkFactory(
            slug="shared-link",
            destination_url="https://example.com/shared",
        )

        # Người thứ nhất: IP 1, Chrome
        res1 = client.get(
            f"{BASE_URL}/{link.slug}",
            HTTP_USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Chrome/120.0)",
            REMOTE_ADDR="198.51.100.1",
        )
        assert res1.status_code == 200

        # Người thứ hai: IP 2, Safari
        res2 = client.get(
            f"{BASE_URL}/{link.slug}",
            HTTP_USER_AGENT="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
            REMOTE_ADDR="198.51.100.2",
        )
        assert res2.status_code == 200

        link.refresh_from_db()
        assert link.clicks_count == 2
        assert link.visitors_count == 2

    def test_resolve_same_ip_different_devices_recognized_as_different_visitors(self, client: Any) -> None:
        """2 người cùng mạng WiFi (cùng IP) nhưng dùng thiết bị khác nhau được tính là 2 người vào."""
        link = ShortLinkFactory(
            slug="office-wifi-link",
            destination_url="https://example.com/office",
        )

        # Người A: cùng IP công ty, dùng Laptop Windows Chrome
        client.get(
            f"{BASE_URL}/{link.slug}",
            HTTP_USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
            REMOTE_ADDR="203.0.113.50",
        )

        # Người B: cùng IP công ty, dùng iPhone Safari
        client.get(
            f"{BASE_URL}/{link.slug}",
            HTTP_USER_AGENT="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148",
            REMOTE_ADDR="203.0.113.50",
        )

        link.refresh_from_db()
        # Vì fingerprint (IP + User-Agent) khác nhau, cả 2 được tính là 2 người vào riêng biệt
        assert link.clicks_count == 2
        assert link.visitors_count == 2

    @pytest.mark.django_db(transaction=True)
    def test_resolve_concurrent_visitors_atomic_increment(self) -> None:
        """Kiểm tra concurrency: nhiều thread cùng gọi record_access đồng thời không bị lost update."""
        import threading

        from django.db import connection

        link = ShortLinkFactory(slug="concurrency-test", destination_url="https://example.com/concurrency")
        service = ShortLinkService()

        def visit(ip: str, ua: str) -> None:
            connection.close()
            service.record_access(link, client_ip=ip, user_agent=ua)
            connection.close()

        threads = [threading.Thread(target=visit, args=(f"192.0.2.{i}", f"Browser-{i}")) for i in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        link.refresh_from_db()
        assert link.clicks_count == 10
        assert link.visitors_count == 10

    def test_resolve_mixed_case_slug_case_insensitive(self, client: Any) -> None:
        """Resolve slug hoa thường hoạt động không phân biệt chữ hoa hay chữ thường."""
        ShortLinkFactory(
            slug="ToanToChill",
            destination_url="https://facebook.com/toantochill",
            status=ShortLink.Status.ACTIVE,
        )

        # 1. Gọi đúng slug viết hoa
        res1 = client.get(f"{BASE_URL}/ToanToChill")
        assert res1.status_code == 200
        data1 = self.assert_success(res1, 200)
        assert data1["destination_url"] == "https://facebook.com/toantochill"

        # 2. Gọi slug viết thường
        res2 = client.get(f"{BASE_URL}/toantochill")
        assert res2.status_code == 200
        data2 = self.assert_success(res2, 200)
        assert data2["destination_url"] == "https://facebook.com/toantochill"

        # 3. Gọi slug toàn bộ hoa
        res3 = client.get(f"{BASE_URL}/TOANTOCHILL")
        assert res3.status_code == 200

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
