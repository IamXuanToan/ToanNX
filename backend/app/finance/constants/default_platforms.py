"""Bộ nền tảng mẫu (tạo khi migrate cho superuser đầu tiên, người khác bấm "Tạo mẫu")."""

from datetime import date

DONATE_PLATFORM_CODE = "donate"
LEGACY_DONATION_PLATFORM_CODE = "sepay_donation"
DONATE_DEFAULT_NAME = "Donate"
DONATE_DEFAULT_COLOR = "#DB2777"
DONATE_DEFAULT_PATTERN = r"DONATE|UNG\s*HO|QUYEN\s*GOP"
DEFAULT_TAX_RATE_EFFECTIVE_FROM = date(2020, 1, 1)

DEFAULT_PLATFORMS: tuple[dict[str, str], ...] = (
    {
        "code": "facebook",
        "name": "Facebook",
        "color": "#2563EB",
        "pattern": r"FACEBOOK|META\s*PLATFORMS",
    },
    {
        "code": "youtube",
        "name": "YouTube",
        "color": "#DC2626",
        "pattern": r"YOUTUBE|GOOGLE\s*ASIA",
    },
    {
        "code": "tiktok",
        "name": "TikTok",
        "color": "#0891B2",
        "pattern": r"TIKTOK|BYTEDANCE",
    },
    {
        "code": "shopee",
        "name": "Shopee",
        "color": "#EA580C",
        "pattern": r"SHOPEE",
    },
    {
        "code": DONATE_PLATFORM_CODE,
        "name": DONATE_DEFAULT_NAME,
        "color": DONATE_DEFAULT_COLOR,
        "pattern": DONATE_DEFAULT_PATTERN,
    },
)
