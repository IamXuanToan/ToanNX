"""Chuẩn hóa slug cho từng namespace URL công khai."""

import re
import secrets

from app.core.exceptions.validation_error import ValidationError

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
RESERVED_SLUGS = frozenset(
    {"admin", "api", "login", "register", "system", "settings", "new", "edit", "create"}
)
MIN_SLUG_LENGTH = 3
MAX_SLUG_LENGTH = 64


def normalize_slug(value: str) -> str:
    """Chuẩn hóa chữ thường và từ chối slug không hợp lệ hoặc đã dành riêng."""
    slug = value.strip().lower()
    if not MIN_SLUG_LENGTH <= len(slug) <= MAX_SLUG_LENGTH or not SLUG_PATTERN.fullmatch(slug):
        raise ValidationError(
            details={"slug": ["Slug phải dài 3–64 ký tự, chỉ gồm a-z, 0-9 và dấu gạch ngang."]}
        )
    if slug in RESERVED_SLUGS:
        raise ValidationError(details={"slug": ["Slug này đã được dành riêng."]})
    return slug


def generate_slug() -> str:
    """Sinh slug ngẫu nhiên khó đoán; ràng buộc unique ở DB vẫn là chốt cuối."""
    return secrets.token_hex(6)
