"""Bộ nền tảng mẫu (tạo khi migrate cho superuser đầu tiên, người khác bấm "Tạo mẫu"). Không kèm mốc thuế."""

DEFAULT_PLATFORMS: tuple[dict[str, str], ...] = (
    {"code": "facebook", "name": "Facebook", "pattern": r"FACEBOOK|META\s*PLATFORMS"},
    {"code": "youtube", "name": "YouTube", "pattern": r"YOUTUBE|GOOGLE\s*ASIA"},
    {"code": "tiktok", "name": "TikTok", "pattern": r"TIKTOK|BYTEDANCE"},
    {"code": "shopee", "name": "Shopee", "pattern": r"SHOPEE"},
)
