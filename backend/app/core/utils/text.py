"""Tiện ích chuỗi dùng chung, dựa trên thư viện `anyascii` (không tự viết bảng bỏ dấu).

Tìm kiếm không dấu **không** dùng file này: `CoreSearchFilter` để PostgreSQL `unaccent` xử lý cả cột lẫn
từ khóa, hai phía cùng một bộ quy đổi nên không lệch nhau.
"""

from anyascii import anyascii
from django.utils.text import slugify


def to_ascii(value: str) -> str:
    """Chuyển sang ASCII, bỏ dấu tiếng Việt (gồm `đ`, dấu chồng như `ặ`, `ự`) và mọi ngôn ngữ khác.

    Args:
        value: Chuỗi gốc.

    Returns:
        Chuỗi ASCII, ví dụ `Nguyễn Đức` → `Nguyen Duc`.
    """
    return anyascii(value)


def ascii_slug(value: str) -> str:
    """Slug ASCII từ chuỗi bất kỳ (`slugify` của Django bỏ mất `Đ` nên phải chuyển ASCII trước).

    Args:
        value: Chuỗi gốc.

    Returns:
        Slug chữ thường, ví dụ `Ủng hộ Đức` → `ung-ho-duc`.
    """
    return slugify(to_ascii(value))
