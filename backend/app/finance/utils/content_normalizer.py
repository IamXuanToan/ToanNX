"""Chuẩn hóa nội dung chuyển khoản để so quy tắc (giữ bản gốc riêng)."""

import re
import unicodedata

from app.core.utils.text import to_ascii

_SPACES = re.compile(r"\s+")


def normalize_content(value: str | None) -> str:
    """NFC → bỏ dấu → chữ hoa → gộp khoảng trắng (`"Shopee - hoa hồng"` → `"SHOPEE - HOA HONG"`)."""
    text = to_ascii(unicodedata.normalize("NFC", value or "")).upper()
    return _SPACES.sub(" ", text).strip()
