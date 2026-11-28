"""Dịch vụ trích xuất metadata từ URL (OpenGraph, Twitter Card, JSON-LD, HTML tags).

Hỗ trợ nhận diện nền tảng e-commerce và caching trên Redis để tiết kiệm tài nguyên.
"""

import contextlib
import hashlib
import json
import re
from typing import Any
from urllib.parse import parse_qs, unquote, urlsplit

import regex

from app.core.cache.cache_service import CacheService
from app.core.constants.defaults import DEFAULT_CURRENCY_CODE
from app.core.utils.safe_http_client import SafeHttpClient
from app.utilities.constants.affiliate_platform import (
    PLATFORM_DOMAIN_PATTERNS,
    AffiliatePlatform,
)
from app.utilities.utils.metadata_html_parser import MetadataHtmlParser
from app.workspace.services.xkiro_client import XkiroClient

_METADATA_CACHE_TTL_SECONDS = 604800  # 7 ngày
_SHOPEE_IMAGE_CDN_BASE = "https://down-vn.img.susercontent.com/file/"
_IMAGE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{8,100}$")
_AI_METADATA_PROMPT = (
    "Bạn là chuyên gia chuẩn hóa thông tin sản phẩm Affiliate TMĐT. "
    "Dựa vào tên thô/slug URL và đoạn văn bản trích xuất từ trang web (nếu có), "
    'hãy trả về DUY NHẤT một JSON object hợp lệ theo mẫu {"title": "...", "description": "..."}.\n'
    "Quy tắc:\n"
    "- `title`: Chuẩn hóa lại tên sản phẩm cho gọn đẹp, đúng chính tả tiếng Việt "
    "(tối đa 160 ký tự).\n"
    "- `description`: Viết 1-2 câu mô tả ngắn gọn, tự nhiên, hữu ích dựa trên đúng "
    "tên/thông tin sản phẩm đã có (tối đa 300 ký tự). Tuyệt đối KHÔNG bịa giá tiền, "
    "thông số kỹ thuật hay khuyến mãi không có trong dữ liệu.\n"
    "- Nếu không có bất kỳ manh mối tên sản phẩm nào (ví dụ URL chỉ là mã số), "
    "trả về chuỗi rỗng cho cả hai trường."
)


class LinkMetadataService:
    """Service trích xuất metadata sản phẩm/liên kết từ URL."""

    def __init__(
        self,
        http_client: SafeHttpClient | None = None,
        cache_service: CacheService | None = None,
        xkiro_client: XkiroClient | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc HTTP Client, Cache Service và AI Client."""
        self.http_client = http_client or SafeHttpClient()
        self.cache_service = cache_service or CacheService()
        self.xkiro_client = xkiro_client or XkiroClient()

    def fetch_metadata(
        self,
        url: str,
        platforms: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Lấy metadata của URL với caching Redis 7 ngày; áp dụng nhận diện nơi bán riêng của trang nếu có.

        Args:
            url: Đường dẫn URL cần đọc.
            platforms: Danh sách nơi bán (`code`, `url_pattern`) riêng của trang Affiliate.

        Returns:
            Dict chứa title, description, image_url, platform, price, currency...
        """
        clean_url = url.strip()
        # Tự động loại bỏ ký tự gõ nhầm ở đầu URL trước giao thức http:// hoặc https:// (ví dụ 'đhttps://...')
        http_match = re.search(r"https?://", clean_url, re.IGNORECASE)
        if http_match and http_match.start() > 0:
            clean_url = clean_url[http_match.start() :]

        url_hash = hashlib.sha256(clean_url.encode()).hexdigest()
        cache_key = f"utilities:metadata:v2:{url_hash}"

        cached = self.cache_service.get_json(cache_key)
        if isinstance(cached, dict):
            result = dict(cached)
            if platforms is not None:
                target_url = str(result.get("canonical_url") or clean_url)
                result["platform"] = self.detect_platform(
                    target_url,
                    platforms=platforms,
                    original_url=clean_url,
                )
            return result

        html_text, final_url = self.http_client.fetch_html(clean_url)
        metadata = self._parse_html_metadata(html_text, clean_url, final_url, platforms=platforms)

        self.cache_service.set_json(cache_key, metadata, _METADATA_CACHE_TTL_SECONDS)
        return metadata

    def _parse_html_metadata(
        self,
        html: str,
        original_url: str,
        final_url: str,
        *,
        platforms: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Phân tích nội dung HTML để trích xuất các trường thông tin."""
        parser = MetadataHtmlParser()
        with contextlib.suppress(Exception):
            parser.feed(html)

        meta = parser.meta_tags
        platform = self.detect_platform(final_url, platforms=platforms, original_url=original_url)

        # 1. Tiêu đề (OpenGraph -> Twitter -> Title HTML -> Fallback URL Slug)
        title = meta.get("og:title") or meta.get("twitter:title") or parser.title or meta.get("title", "")
        title = self._clean_title(title)
        used_slug_fallback = False
        if not title or title.lower() in (
            "shopee",
            "shopee việt nam",
            "lazada",
            "tiki",
            "tiktok",
            "tiktok shop",
        ):
            slug_title = self._fallback_title_from_url(final_url) or self._fallback_title_from_url(
                original_url
            )
            if slug_title:
                title = slug_title
                used_slug_fallback = True

        # 2. Mô tả (OpenGraph -> Twitter -> Meta description)
        description = (
            meta.get("og:description") or meta.get("twitter:description") or meta.get("description", "")
        )

        # 3. Hình ảnh (HTML meta -> fallback query `image_ids` của Shopee)
        image_url = meta.get("og:image") or meta.get("twitter:image") or None
        if not image_url and platform == AffiliatePlatform.SHOPEE.value:
            image_url = self._extract_shopee_image_from_url(
                original_url
            ) or self._extract_shopee_image_from_url(final_url)

        # 4. AI chuẩn hóa tiêu đề & bổ sung mô tả khi trang TMĐT chống bot / thiếu meta
        if (used_slug_fallback or not title or not description) and (title or description):
            title, description = self._enrich_with_ai(
                original_url=original_url,
                final_url=final_url,
                platform=platform,
                title=title,
                description=description,
            )

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
            "currency": currency or DEFAULT_CURRENCY_CODE,
            "canonical_url": meta.get("og:url") or final_url,
            "destination_url": original_url,
        }

    def detect_platform(
        self,
        url: str,
        platforms: list[dict[str, Any]] | None = None,
        *,
        original_url: str = "",
    ) -> str:
        """Nhận diện nơi bán theo regex riêng của trang trước, sau đó fallback danh sách mặc định."""
        targets = [u for u in (url, original_url) if u]
        if platforms:
            for item in platforms:
                code = str(item.get("code") or "").strip()
                pattern = str(item.get("url_pattern") or "").strip()
                if not code or not pattern:
                    continue
                if self._match_url_pattern(pattern, targets):
                    return code

        for target in targets:
            hostname = (urlsplit(target).hostname or "").lower()
            for patterns, platform in PLATFORM_DOMAIN_PATTERNS:
                if any(pattern in hostname for pattern in patterns):
                    return platform.value
        return AffiliatePlatform.CUSTOM.value

    @staticmethod
    def _match_url_pattern(pattern: str, urls: list[str]) -> bool:
        """Khớp biểu thức Regex (có timeout chống ReDoS) hoặc danh sách domain phân cách bằng dấu phẩy."""
        for target in urls:
            try:
                if regex.search(pattern, target, flags=regex.IGNORECASE, timeout=0.05):
                    return True
            except (regex.error, TimeoutError):
                # Nếu người dùng nhập danh sách domain đơn giản phân cách bởi dấu phẩy
                parts = [p.strip().lower() for p in pattern.split(",") if p.strip()]
                lowered = target.lower()
                if any(part in lowered for part in parts):
                    return True
        return False

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

    def _extract_shopee_image_from_url(self, url: str) -> str | None:
        """Trích ảnh sản phẩm Shopee từ tham số `image_ids` trên URL khi SPA không trả OpenGraph."""
        try:
            query = parse_qs(urlsplit(url).query)
            raw_ids = query.get("image_ids") or []
            for entry in raw_ids:
                for candidate in str(entry).split(","):
                    cleaned = candidate.strip()
                    if _IMAGE_ID_RE.match(cleaned):
                        return f"{_SHOPEE_IMAGE_CDN_BASE}{cleaned}"
        except (ValueError, TypeError):
            return None
        return None

    def _enrich_with_ai(
        self,
        *,
        original_url: str,
        final_url: str,
        platform: str,
        title: str,
        description: str,
    ) -> tuple[str, str]:
        """Dùng XkiroClient chuẩn hóa tiêu đề từ slug và tạo mô tả ngắn khi thiếu metadata."""
        if not self.xkiro_client.is_configured():
            return title, description
        user_content = json.dumps(
            {
                "platform": platform,
                "raw_title": title[:200],
                "raw_description": description[:400],
                "url": final_url[:300] or original_url[:300],
            },
            ensure_ascii=False,
        )
        res = self.xkiro_client.chat_completion(
            [
                {"role": "system", "content": _AI_METADATA_PROMPT},
                {"role": "user", "content": user_content},
            ],
            tools=None,
            timeout_seconds=15.0,
            max_tokens=600,
            stream=True,
        )
        if not res.get("ok"):
            return title, description
        raw_text = str((res.get("message") or {}).get("content") or "").strip()
        raw_text = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_text, flags=re.IGNORECASE).strip()
        try:
            parsed = json.loads(raw_text)
        except ValueError:
            return title, description
        if not isinstance(parsed, dict):
            return title, description
        ai_title = str(parsed.get("title") or "").strip()
        ai_desc = str(parsed.get("description") or "").strip()
        return (ai_title or title, ai_desc or description)

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
