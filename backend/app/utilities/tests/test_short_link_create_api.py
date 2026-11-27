"""Kiểm thử endpoint tạo short link: POST /api/v1/utilities/short-links."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.short_link import ShortLink
from app.utilities.permissions.short_link_permission import ShortLinkPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/short-links"


class TestShortLinkCreateApi(BaseApiTestCase):
    """Kiểm thử chi tiết endpoint POST /api/v1/utilities/short-links."""

    def test_create_success_full_data(self, user: Any, login: Any) -> None:
        """Tạo short link với đầy đủ thông tin (tên, slug, destination_url, auto_redirect, password)."""
        grant(user, P.CREATE)
        api = login(user)

        payload = {
            "name": "Link Đầy Đủ",
            "slug": "full-link",
            "destination_url": "https://example.com/target",
            "description": "Chi tiết link",
            "auto_redirect_seconds": 5,
            "password": "secret-password",
        }
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["name"] == "Link Đầy Đủ"
        assert data["slug"] == "full-link"
        assert data["owner_id"] == str(user.pk)
        assert data["short_url"] == "http://testserver/s/full-link"
        assert data["auto_redirect_seconds"] == 5
        assert data["has_password"] is True
        assert "password" not in data and "password_hash" not in data

        link = ShortLink.objects.get(pk=data["id"])
        assert link.owner_id == user.pk
        assert link.password_hash != "secret-password"

    def test_create_success_mixed_case_slug(self, user: Any, login: Any) -> None:
        """Tạo short link với slug chứa chữ hoa chữ thường (ví dụ ToanToChill)."""
        grant(user, P.CREATE)
        api = login(user)

        payload = {
            "name": "Toan To Chill Fanpage",
            "slug": "ToanToChill",
            "destination_url": "https://facebook.com/toantochill",
        }
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)
        assert data["slug"] == "ToanToChill"
        assert data["short_url"] == "http://testserver/s/ToanToChill"

    def test_create_success_min_data(self, user: Any, login: Any) -> None:
        """Tạo short link với dữ liệu tối thiểu (bỏ slug để hệ thống tự sinh UUID)."""
        grant(user, P.CREATE)
        api = login(user)

        payload = {
            "name": "Link Tối Thiểu",
            "destination_url": "https://example.com/min",
        }
        res = api.post(URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["name"] == "Link Tối Thiểu"
        assert len(data["slug"]) == 36
        assert data["auto_redirect_seconds"] is None
        assert data["has_password"] is False

    def test_create_validation_missing_required_fields(self, user: Any, login: Any) -> None:
        """Validate lỗi khi thiếu name hoặc destination_url."""
        grant(user, P.CREATE)
        api = login(user)

        res = api.post(URL, {}, format="json")
        error = self.assert_error(res, 400, "VALIDATION_ERROR")
        assert "name" in error["details"]
        assert "destination_url" in error["details"]

    def test_create_validation_invalid_url_and_slug(self, user: Any, login: Any) -> None:
        """Validate lỗi khi URL sai giao thức hoặc slug chứa ký tự cấm."""
        grant(user, P.CREATE)
        api = login(user)

        # 1. URL javascript:alert
        res1 = api.post(
            URL,
            {"name": "Bad URL", "slug": "bad-url", "destination_url": "javascript:alert(1)"},
            format="json",
        )
        self.assert_error(res1, 400, "VALIDATION_ERROR")

        # 2. Slug chứa dấu gạch chéo
        res2 = api.post(
            URL,
            {"name": "Bad Slug", "slug": "bad/slug", "destination_url": "https://example.com"},
            format="json",
        )
        self.assert_error(res2, 400, "VALIDATION_ERROR")

        # 3. URL loop tự trỏ vào chính nó
        res3 = api.post(
            URL,
            {"name": "Loop", "slug": "loop", "destination_url": "https://toannx.com/s/loop"},
            format="json",
        )
        self.assert_error(res3, 400, "VALIDATION_ERROR")

    def test_create_duplicate_slug_conflict(self, user: Any, login: Any) -> None:
        """Tạo slug trùng nhau (kể cả khác hoa thường) bị 409 CONFLICT."""
        grant(user, P.CREATE)
        api = login(user)

        payload = {"name": "Link 1", "slug": "unique-slug", "destination_url": "https://example.com"}
        self.assert_success(api.post(URL, payload, format="json"), 201)

        # Trùng slug dạng chữ hoa
        payload_dup = {"name": "Link 2", "slug": "UNIQUE-SLUG", "destination_url": "https://example.com"}
        res = api.post(URL, payload_dup, format="json")
        self.assert_error(res, 409, "CONFLICT")

    def test_create_rate_limit(self, user: Any, login: Any, settings: Any) -> None:
        """Áp dụng rate limit tạo short link."""
        from app.utilities.constants.utilities_rate_limit_key import UtilitiesRateLimitKey

        settings.RATE_LIMITS = {
            **settings.RATE_LIMITS,
            UtilitiesRateLimitKey.SHORT_LINK_CREATE: (1, 3600, "user"),
        }
        grant(user, P.CREATE)
        api = login(user)

        p1 = {"name": "Link 1", "slug": "rate-1", "destination_url": "https://example.com"}
        p2 = {"name": "Link 2", "slug": "rate-2", "destination_url": "https://example.com"}

        self.assert_success(api.post(URL, p1, format="json"), 201)
        res2 = api.post(URL, p2, format="json")
        self.assert_error(res2, 429, "RATE_LIMITED")

    def test_create_unauthenticated_rejected(self, client: Any) -> None:
        """Khách chưa đăng nhập bị 401."""
        res = client.post(URL, {"name": "Link", "destination_url": "https://example.com"}, format="json")
        self.assert_unauthorized(res)

    def test_create_forbidden_without_permission(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền utilities.short_link.create bị 403."""
        api = login(user)
        res = api.post(URL, {"name": "Link", "destination_url": "https://example.com"}, format="json")
        self.assert_forbidden(res)
