"""Tiện ích chuỗi dùng chung."""

import unicodedata

# `đ`/`Đ` không tách được bằng Unicode NFD nên đổi tay (giống `unaccent` của PostgreSQL).
_SPECIAL = str.maketrans({"đ": "d", "Đ": "D"})


def strip_accents(value: str) -> str:
    """Bỏ dấu tiếng Việt (và dấu Latin nói chung), giữ nguyên chữ hoa/thường.

    Args:
        value: Chuỗi gốc.

    Returns:
        Chuỗi không dấu, ví dụ `Nguyễn Đức` → `Nguyen Duc`.
    """
    decomposed = unicodedata.normalize("NFD", value.translate(_SPECIAL))
    return "".join(char for char in decomposed if unicodedata.category(char) != "Mn")
