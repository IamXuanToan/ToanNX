"""Kiểm thử các nghiệp vụ tạo, sửa, sao chép và xem trang hệ thống Template (Affiliate, Bio, Donation...)."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.page import Page
from app.utilities.permissions.page_permission import PagePermission as P
from app.utilities.tests.helpers.page_test_helper import get_seeded_path

pytestmark = pytest.mark.django_db
PAGES_URL = "/api/v1/utilities/pages"


class TestPageTemplateCrudApi(BaseApiTestCase):
    """Kiểm thử toàn diện API trang Template (Affiliate, Bio, Donation...)."""

    def test_create_affiliate_page_success(self, user: Any, login: Any) -> None:
        """Tạo trang loại AFFILIATE thành công kèm đầy đủ cấu hình template."""
        grant(user, P.CREATE)
        path = get_seeded_path("p")
        api = login(user)

        payload = {
            "path_id": str(path.pk),
            "title": "Góc Đồ Công Nghệ",
            "slug": "tech-gadgets",
            "page_type": "AFFILIATE",
            "template_key": "product_grid",
            "template_version": 1,
            "content_config": {
                "items": [
                    {
                        "id": "item-101",
                        "title": "Bàn phím cơ không dây",
                        "platform": "shopee",
                        "destinationUrl": "https://shopee.vn/product/123",
                        "priceConfig": {"mode": "fixed", "amount": 850000},
                    }
                ],
                "categories": [{"id": "cat-1", "name": "Bàn phím"}],
            },
            "style_config": {
                "themePreset": "emerald_green",
                "primaryColor": "#3D812E",
                "layout": "grid",
                "showPrice": True,
            },
            "responsive_config": {
                "desktopColumns": 3,
                "tabletColumns": 2,
                "mobileColumns": 1,
            },
        }

        res = api.post(PAGES_URL, payload, format="json")
        data = self.assert_success(res, 201)

        assert data["title"] == "Góc Đồ Công Nghệ"
        assert data["slug"] == "tech-gadgets"
        assert data["page_type"] == "AFFILIATE"
        assert data["template_key"] == "product_grid"
        assert data["template_version"] == 1
        assert len(data["content_config"]["items"]) == 1
        assert data["content_config"]["items"][0]["title"] == "Bàn phím cơ không dây"
        assert data["style_config"]["primary_color"] == "#3d812e"
        assert data["responsive_config"]["desktopColumns"] == 3

    def test_create_page_invalid_page_type(self, user: Any, login: Any) -> None:
        """Tạo trang với page_type không hợp lệ bị từ chối 400 Bad Request."""
        grant(user, P.CREATE)
        path = get_seeded_path("p")
        api = login(user)

        payload = {
            "path_id": str(path.pk),
            "title": "Trang Không Hợp Lệ",
            "page_type": "UNKNOWN_PAGE_TYPE",
        }
        res = api.post(PAGES_URL, payload, format="json")
        assert res.status_code == 400

    def test_update_affiliate_page_content_config(self, user: Any, login: Any) -> None:
        """Cập nhật cấu hình nội dung và giao diện của trang Template."""
        grant(user, P.CREATE, P.UPDATE, P.READ)
        path = get_seeded_path("p")
        api = login(user)

        # 1. Tạo trang ban đầu
        create_payload = {
            "path_id": str(path.pk),
            "title": "Kho Sách Hay",
            "slug": "good-books",
            "page_type": "AFFILIATE",
            "template_key": "product_list",
            "content_config": {"items": []},
        }
        res_create = api.post(PAGES_URL, create_payload, format="json")
        page_id = self.assert_success(res_create, 201)["id"]

        # 2. Cập nhật thêm sản phẩm qua PATCH
        update_payload = {
            "title": "Kho Sách Hay Của Tôi",
            "content_config": {
                "items": [
                    {
                        "id": "book-1",
                        "title": "Clean Code",
                        "platform": "tiki",
                        "destinationUrl": "https://tiki.vn/clean-code",
                    }
                ]
            },
            "style_config": {"layout": "list"},
        }
        res_update = api.patch(f"{PAGES_URL}/{page_id}", update_payload, format="json")
        data_updated = self.assert_success(res_update, 200)

        assert data_updated["title"] == "Kho Sách Hay Của Tôi"
        assert len(data_updated["content_config"]["items"]) == 1
        assert data_updated["content_config"]["items"][0]["title"] == "Clean Code"
        assert data_updated["style_config"]["layout"] == "list"

    def test_duplicate_template_page_preserves_configs(self, user: Any, login: Any) -> None:
        """Nhân bản (duplicate) trang giữ nguyên toàn bộ cấu hình template."""
        grant(user, P.CREATE, P.READ)
        path = get_seeded_path("p")
        api = login(user)

        # 1. Tạo trang gốc
        create_payload = {
            "path_id": str(path.pk),
            "title": "Bio Creator",
            "slug": "bio-creator",
            "page_type": "BIO",
            "template_key": "creator_profile",
            "content_config": {
                "profile": {"displayName": "Dev Guy", "bioText": "Full-stack coder"},
                "links": [{"id": "link-1", "title": "GitHub", "url": "https://github.com"}],
            },
            "style_config": {"primaryColor": "#4F46E5"},
        }
        res_create = api.post(PAGES_URL, create_payload, format="json")
        page_id = self.assert_success(res_create, 201)["id"]

        # 2. Nhân bản trang
        res_duplicate = api.post(f"{PAGES_URL}/{page_id}/duplicate")
        data_copy = self.assert_success(res_duplicate, 201)

        assert data_copy["id"] != page_id
        assert data_copy["page_type"] == "BIO"
        assert data_copy["template_key"] == "creator_profile"
        assert data_copy["content_config"]["profile"]["displayName"] == "Dev Guy"
        assert len(data_copy["content_config"]["links"]) == 1
        assert data_copy["style_config"]["primary_color"] == "#4f46e5"

    def test_filter_pages_by_page_type(self, user: Any, login: Any) -> None:
        """Lọc danh sách trang theo page_type hoạt động chính xác."""
        grant(user, P.CREATE, P.READ)
        path = get_seeded_path("p")
        api = login(user)

        # Tạo 1 trang AFFILIATE và 1 trang DONATION
        api.post(
            PAGES_URL,
            {
                "path_id": str(path.pk),
                "title": "Shop Affiliate 1",
                "slug": "affiliate-filter-1",
                "page_type": "AFFILIATE",
            },
            format="json",
        )
        api.post(
            PAGES_URL,
            {
                "path_id": str(path.pk),
                "title": "Donate 1",
                "slug": "donate-filter-1",
                "page_type": "DONATION",
            },
            format="json",
        )

        # Lọc page_type=AFFILIATE
        res_filtered = api.get(f"{PAGES_URL}?page_type=AFFILIATE")
        data = self.assert_success(res_filtered, 200)

        assert len(data) >= 1
        for item in data:
            assert item["page_type"] == "AFFILIATE"

    def test_public_page_response_includes_template_configs(self, user: Any, login: Any) -> None:
        """API công khai của trang đã xuất bản trả về đầy đủ các trường cấu hình template."""
        grant(user, P.CREATE, P.UPDATE)
        path = get_seeded_path("p")
        api = login(user)

        create_payload = {
            "path_id": str(path.pk),
            "title": "Trang Public Test",
            "slug": "public-template-test",
            "page_type": "DONATION",
            "template_key": "vietqr_donate",
            "status": Page.Status.PUBLISHED,
            "content_config": {"bankAccount": {"bankName": "Vietcombank", "accountNumber": "1234567890"}},
            "style_config": {"primaryColor": "#0284C7"},
        }
        res_create = api.post(PAGES_URL, create_payload, format="json")
        self.assert_success(res_create, 201)

        # Gọi API trang công khai
        res_public = api.get(f"{PAGES_URL}/public/p/public-template-test")
        data_public = self.assert_success(res_public, 200)

        assert data_public["page_type"] == "DONATION"
        assert data_public["template_key"] == "vietqr_donate"
        assert data_public["content_config"]["bankAccount"]["bankName"] == "Vietcombank"
        assert data_public["style_config"]["primary_color"] == "#0284c7"
