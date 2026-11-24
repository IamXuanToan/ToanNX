"""Dịch vụ trích xuất metadata từ URL (OpenGraph, Twitter Card, JSON-LD, HTML tags).

Hỗ trợ nhận diện nền tảng e-commerce và caching trên Redis để tiết kiệm tài nguyên.
"""

import contextlib
import hashlib
import json
import re
from typing import Any
from urllib.parse import unquote, urlsplit

from app.core.cache.cache_service import CacheService
from app.utilities.constants.affiliate_platform import (
    PLATFORM_DOMAIN_PATTERNS,
    AffiliatePlatform,
)
from app.utilities.utils.metadata_html_parser import MetadataHtmlParser
from app.utilities.utils.safe_http_client import SafeHttpClient

_METADATA_CACHE_TTL_SECONDS = 604800  # 7 ngày


class LinkMetadataService:
    """Service trích xuất metadata sản phẩm/liên kết từ URL."""

    def __init__(
        self,
        http_client: SafeHttpClient | None = None,
        cache_service: CacheService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc HTTP Client và Cache Service."""
        self.http_client = http_client or SafeHttpClient()
        self.cache_service = cache_service or CacheService()

    def fetch_metadata(self, url: str) -> dict[str, Any]:
        """Lấy metadata của URL với caching Redis 7 ngày.

        Args:
            url: Đường dẫn URL cần đọc.

        Returns:
            Dict chứa title, description, image_url, platform, price, currency...
        """
        clean_url = url.strip()
        # Tự động loại bỏ ký tự gõ nhầm ở đầu URL trước giao thức http:// hoặc https:// (ví dụ 'đhttps://...')
        http_match = re.search(r"https?://", clean_url, re.IGNORECASE)
        if http_match and http_match.start() > 0:
            clean_url = clean_url[http_match.start() :]

        url_hash = hashlib.sha256(clean_url.encode()).hexdigest()
        cache_key = f"utilities:metadata:{url_hash}"

        cached = self.cache_service.get_json(cache_key)
        if isinstance(cached, dict):
            return cached

        html_text, final_url = self.http_client.fetch_html(clean_url)
        metadata = self._parse_html_metadata(html_text, clean_url, final_url)

        self.cache_service.set_json(cache_key, metadata, _METADATA_CACHE_TTL_SECONDS)
        return metadata

    def _parse_html_metadata(self, html: str, original_url: str, final_url: str) -> dict[str, Any]:
        """Phân tích nội dung HTML để trích xuất các trường thông tin."""
        parser = MetadataHtmlParser()
        with contextlib.suppress(Exception):
            parser.feed(html)

        meta = parser.meta_tags
        platform = self.detect_platform(final_url)

        # 1. Tiêu đề (OpenGraph -> Twitter -> Title HTML -> Fallback URL Slug)
        title = meta.get("og:title") or meta.get("twitter:title") or parser.title or meta.get("title", "")
        title = self._clean_title(title)
        if not title or title.lower() in (
            "shopee",
            "shopee việt nam",
            "lazada",
            "tiki",
            "tiktok",
            "tiktok shop",
        ):
            title = (
                self._fallback_title_from_url(final_url)
                or self._fallback_title_from_url(original_url)
                or title
            )

        # 2. Mô tả (OpenGraph -> Twitter -> Meta description)
        description = (
            meta.get("og:description") or meta.get("twitter:description") or meta.get("description", "")
        )

        # 3. Hình ảnh
        image_url = meta.get("og:image") or meta.get("twitter:image") or None

        # 4. Tên trang / Website
        site_name = meta.get("og:site_name") or self._extract_domain(final_url)

        # 5. Giá và tiền tệ (từ meta hoặc JSON-LD)
        price, currency = self._extract_price(meta, parser.json_ld_scripts)

        return {
            "title": title[:200],
            "description": description[:500],
            "image_url": image_url,
            "platform": platform,
            "site_name": site_name,
            "price": price,
            "currency": currency or "VND",
            "canonical_url": meta.get("og:url") or final_url,
            "destination_url": original_url,
        }

    def detect_platform(self, url: str) -> str:
        """Nhận diện sàn TMĐT từ hostname của URL."""
        hostname = (urlsplit(url).hostname or "").lower()
        for patterns, platform in PLATFORM_DOMAIN_PATTERNS:
            if any(pattern in hostname for pattern in patterns):
                return platform.value
        return AffiliatePlatform.CUSTOM.value

    def _clean_title(self, raw_title: str) -> str:
        """Làm sạch tiêu đề, loại bỏ khoảng trắng thừa."""
        cleaned = re.sub(r"\s+", " ", raw_title).strip()
        return cleaned

    def _fallback_title_from_url(self, url: str) -> str:
        """Trích xuất tiêu đề từ slug của URL khi web không trả OpenGraph (SPA Shopee/Lazada)."""
        try:
            path = unquote(urlsplit(url).path).strip("/")
            if not path:
                return ""

            # 1. Shopee: dạng /<ten-san-pham>-i.<shop_id>.<item_id>
            if "-i." in path:
                slug = path.split("-i.")[0]
                slug = slug.split("/")[-1]
                title = slug.replace("-", " ").strip()
                if title:
                    return re.sub(r"\s+", " ", title)

            # 2. Lazada: dạng /<ten-san-pham>-i<id>.html
            if re.search(r"-i\d+\.html", path):
                slug = re.sub(r"-i\d+\.html.*", "", path)
                slug = slug.split("/")[-1]
                title = slug.replace("-", " ").strip()
                if title:
                    return re.sub(r"\s+", " ", title)

            # 3. Tiki: dạng /<ten-san-pham>-p<id>.html
            if re.search(r"-p\d+\.html", path):
                slug = re.sub(r"-p\d+\.html.*", "", path)
                slug = slug.split("/")[-1]
                title = slug.replace("-", " ").strip()
                if title:
                    return re.sub(r"\s+", " ", title)

            # 4. Fallback chung: lấy segment cuối cùng nếu có dấu gạch ngang phân cách từ
            last_segment = path.split("/")[-1]
            last_segment = re.sub(r"\.(html|htm|php|asp|aspx)$", "", last_segment)
            if "-" in last_segment:
                words = [w for w in last_segment.split("-") if not w.isdigit()]
                if len(words) >= 2:
                    return re.sub(r"\s+", " ", " ".join(words)).strip()
        except (ValueError, KeyError, TypeError, IndexError):
            return ""

        return ""

    def _extract_domain(self, url: str) -> str:
        """Lấy hostname của URL."""
        return urlsplit(url).netloc or "Website"

    def _extract_price(
        self, meta: dict[str, str], json_ld_scripts: list[str]
    ) -> tuple[float | None, str | None]:
        """Trích xuất giá bán từ OpenGraph tags hoặc JSON-LD Schema.org Product."""
        # Thử từ OpenGraph
        og_price = meta.get("og:price:amount") or meta.get("product:price:amount")
        og_currency = meta.get("og:price:currency") or meta.get("product:price:currency")
        if og_price:
            try:
                return float(og_price), og_currency
            except ValueError:
                pass

        # Thử từ JSON-LD
        for script in json_ld_scripts:
            try:
                data = json.loads(script)
                price, currency = self._find_price_in_json_ld(data)
                if price is not None:
                    return price, currency
            except (json.JSONDecodeError, TypeError):
                continue

        return None, None

    def _find_price_in_json_ld(self, data: Any) -> tuple[float | None, str | None]:
        """Dò tìm giá trong đối tượng JSON-LD dạng Product / Offer."""
        if isinstance(data, list):
            for item in data:
                price, currency = self._find_price_in_json_ld(item)
                if price is not None:
                    return price, currency
        elif isinstance(data, dict):
            # Kiểm tra offers
            offers = data.get("offers")
            if isinstance(offers, dict):
                price_val = offers.get("price") or offers.get("lowPrice")
                curr = offers.get("priceCurrency")
                if price_val is not None:
                    try:
                        return float(price_val), curr
                    except ValueError:
                        pass
            elif isinstance(offers, list) and offers:
                first_offer = offers[0]
                if isinstance(first_offer, dict):
                    price_val = first_offer.get("price")
                    curr = first_offer.get("priceCurrency")
                    if price_val is not None:
                        try:
                            return float(price_val), curr
                        except ValueError:
                            pass
        return None, None
