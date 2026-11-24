"""Hằng số nền tảng liên kết e-commerce và quy tắc nhận diện sàn."""

from enum import StrEnum


class AffiliatePlatform(StrEnum):
    """Danh mục các nền tảng e-commerce được hỗ trợ nhận diện tự động."""

    SHOPEE = "shopee"
    LAZADA = "lazada"
    TIKTOK = "tiktok"
    TIKI = "tiki"
    AMAZON = "amazon"
    CUSTOM = "custom"


# Mẫu nhận diện sàn từ hostname
PLATFORM_DOMAIN_PATTERNS: tuple[tuple[tuple[str, ...], AffiliatePlatform], ...] = (
    (("shopee", "shp.ee"), AffiliatePlatform.SHOPEE),
    (("lazada",), AffiliatePlatform.LAZADA),
    (("tiktok",), AffiliatePlatform.TIKTOK),
    (("tiki.vn",), AffiliatePlatform.TIKI),
    (("amazon",), AffiliatePlatform.AMAZON),
)
