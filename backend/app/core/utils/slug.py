"""Chuẩn hóa slug cho các URL công khai (slug link rút gọn, slug trang, đoạn đường dẫn giữa)."""

import re
import secrets
from collections.abc import Iterable

from app.core.exceptions.validation_error import ValidationError

SLUG_PATTERN = re.compile(r"^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$")
RESERVED_SLUGS = frozenset(
    {"admin", "api", "login", "register", "system", "settings", "new", "edit", "create"}
)
MIN_SLUG_LENGTH = 3
MAX_SLUG_LENGTH = 64


def normalize_slug(
    value: str,
    *,
    field: str = "slug",
    min_length: int = MIN_SLUG_LENGTH,
    max_length: int = MAX_SLUG_LENGTH,
    reserved: Iterable[str] = RESERVED_SLUGS,
    preserve_case: bool = False,
) -> str:
    """Chữ cái (a-z, A-Z), 0-9, `-` giữa các nhóm; từ chối giá trị dành riêng.

    Args:
        value: Giá trị thô.
        field: Tên field gắn vào lỗi.
        min_length: Độ dài tối thiểu.
        max_length: Độ dài tối đa.
        reserved: Giá trị dành riêng.
        preserve_case: Giữ nguyên hoa/thường (mặc định False = lowercase).

    Returns:
        Slug đã chuẩn hóa.

    Raises:
        ValidationError: Sai định dạng hoặc dành riêng.
    """
    slug = value.strip() if preserve_case else value.strip().lower()
    if not min_length <= len(slug) <= max_length or not SLUG_PATTERN.fullmatch(slug):
        raise ValidationError(
            details={
                field: [f"Dài {min_length}–{max_length} ký tự, chỉ gồm a-z, A-Z, 0-9 và dấu gạch ngang."]
            }
        )
    if slug.lower() in set(reserved):
        raise ValidationError(details={field: ["Giá trị này đã được dành riêng."]})
    return slug


def generate_slug() -> str:
    """Sinh slug ngẫu nhiên khó đoán; ràng buộc unique ở DB vẫn là chốt cuối."""
    return secrets.token_hex(6)
