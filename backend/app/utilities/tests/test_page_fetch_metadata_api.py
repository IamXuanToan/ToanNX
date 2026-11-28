"""Kiểm thử endpoint trích xuất metadata: POST /api/v1/utilities/pages/fetch-metadata."""

from typing import Any
from unittest.mock import patch

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.utilities.permissions.page_permission import PagePermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/utilities/pages/fetch-metadata"


class TestPageFetchMetadataApi(BaseApiTestCase):
    """Kiểm thử bảo mật, phân quyền và dữ liệu trích xuất từ URL."""

    def test_unauthenticated_returns_401(self, client: Any) -> None:
        """Chưa đăng nhập trả về 401."""
        res = client.post(URL, {"url": "https://shopee.vn/product-1"}, format="json")
        self.assert_error(res, 401)

    def test_forbidden_without_create_or_update_perm_returns_403(self, user: Any, login: Any) -> None:
        """Đã đăng nhập nhưng thiếu quyền CREATE/UPDATE trả về 403."""
        api = login(user)
        res = api.post(URL, {"url": "https://shopee.vn/product-1"}, format="json")
        self.assert_error(res, 403)

    def test_fetch_metadata_success(self, user: Any, login: Any) -> None:
        """Trích xuất thành công metadata OpenGraph và nhận diện nền tảng Shopee."""
        grant(user, P.CREATE)
        api = login(user)

        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta property="og:title" content="Bàn phím cơ Rain75 nhôm CNC" />
            <meta property="og:image" content="https://down-vn.img.susercontent.com/file/rain75.jpg" />
            <meta property="og:description" content="Bàn phím cơ gõ cực êm." />
            <meta property="og:price:amount" content="2150000" />
            <meta property="og:price:currency" content="VND" />
        </head>
        <body></body>
        </html>
        """

        with patch(
            "app.core.utils.safe_http_client.SafeHttpClient.fetch_html",
            return_value=(html_content, "https://shopee.vn/product-rain75"),
        ):
            res = api.post(URL, {"url": "https://s.shopee.vn/rain75"}, format="json")
            data = self.assert_success(res, 200)

            assert data["title"] == "Bàn phím cơ Rain75 nhôm CNC"
            assert data["platform"] == "shopee"
            assert data["image_url"] == "https://down-vn.img.susercontent.com/file/rain75.jpg"
            assert data["price"] == 2150000.0
            assert data["currency"] == "VND"
            assert data["destination_url"] == "https://s.shopee.vn/rain75"

    def test_fetch_metadata_ssrf_blocked_returns_400(self, user: Any, login: Any) -> None:
        """Truy cập URL mạng nội bộ trả về 400 kèm thông báo bảo vệ SSRF."""
        grant(user, P.CREATE)
        api = login(user)

        res = api.post(URL, {"url": "http://127.0.0.1:8000/api"}, format="json")
        self.assert_error(res, 400)

    def test_fetch_metadata_shopee_image_ids_and_ai_enrichment(
        self, user: Any, login: Any, settings: Any
    ) -> None:
        """Link Shopee không có OpenGraph vẫn lấy được ảnh từ `image_ids` và làm đẹp tên/mô tả bằng AI."""
        grant(user, P.CREATE)
        api = login(user)

        settings.XKIRO_API_BASE = "https://xkiro.example.com/v1"
        settings.XKIRO_API_KEY = "test-secret"
        settings.XKIRO_MODEL = "model-a"

        shopee_url = (
            "https://shopee.vn/-H%C3%A0ng-s%E1%BA%B5n-M%C3%B4-H%C3%ACnh-L%E1%BA%AFp-r%C3%A1p-"
            "MNP-XH16A-%C4%90i%E1%BB%83n-Vi-Motornuclear-i.1387896381.46018292342"
            "?image_ids=vn-11134201-81ztc-mtf3gai8dts51d"
        )
        ai_resp = {
            "ok": True,
            "model": "model-a",
            "message": {
                "content": (
                    '{"title": "Mô Hình Lắp Ráp MNP-XH16A Điển Vi Motornuclear (Hàng Sẵn)", '
                    '"description": "Mô hình lắp ráp MNP-XH16A Điển Vi chính hãng Motornuclear."}'
                )
            },
            "tokens": 60,
        }

        with (
            patch(
                "app.core.utils.safe_http_client.SafeHttpClient.fetch_html",
                return_value=("<html><head><title>Shopee</title></head><body></body></html>", shopee_url),
            ),
            patch(
                "app.workspace.services.xkiro_client.XkiroClient.chat_completion",
                return_value=ai_resp,
            ),
        ):
            res = api.post(URL, {"url": shopee_url}, format="json")
            data = self.assert_success(res, 200)

        assert data["platform"] == "shopee"
        assert (
            data["image_url"] == "https://down-vn.img.susercontent.com/file/vn-11134201-81ztc-mtf3gai8dts51d"
        )
        assert data["title"] == "Mô Hình Lắp Ráp MNP-XH16A Điển Vi Motornuclear (Hàng Sẵn)"
        assert "Motornuclear" in data["description"]

    def test_fetch_metadata_uses_page_custom_platforms_regex(self, user: Any, login: Any) -> None:
        """Nhận diện đúng shortcode nơi bán riêng của từng trang theo biểu thức Regex URL."""
        grant(user, P.CREATE)
        api = login(user)

        custom_url = "https://shop.mybrand.vn/san-pham/ban-phim-co"
        with patch(
            "app.core.utils.safe_http_client.SafeHttpClient.fetch_html",
            return_value=(
                "<html><head><meta property='og:title' content='Bàn phím MyBrand' /></head></html>",
                custom_url,
            ),
        ):
            res = api.post(
                URL,
                {
                    "url": custom_url,
                    "platforms": [
                        {
                            "code": "my_brand_store",
                            "name": "Cửa hàng MyBrand",
                            "url_pattern": r"(mybrand\.vn|mybrand\.shop)",
                        }
                    ],
                },
                format="json",
            )
            data = self.assert_success(res, 200)

        assert data["platform"] == "my_brand_store"
        assert data["title"] == "Bàn phím MyBrand"
