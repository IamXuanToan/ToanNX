"""Tiện ích làm sạch ô CSV, ngăn chặn tấn công CSV Formula Injection (DDE)."""

from collections.abc import Iterable
from typing import Any

_FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r", "\n")
_TRIMMED_FORMULA_PREFIXES = ("=", "+", "-", "@")


def sanitize_csv_cell(value: Any) -> Any:
    """Trung hòa giá trị chuỗi có thể kích hoạt công thức khi mở bằng Excel / LibreOffice / Google Sheets.

    Args:
        value: Giá trị ô dữ liệu thô.

    Returns:
        Giá trị gốc nếu an toàn (kiểu số, None hoặc chuỗi thường), hoặc chuỗi đã gắn tiền tố `'`
        nếu bắt đầu bằng ký tự công thức (`=`, `+`, `-`, `@`, `\\t`, `\\r`, `\\n` hoặc sau dấu cách).
    """
    if not isinstance(value, str) or not value:
        return value
    stripped = value.lstrip(" \t\r\n")
    if value[0] in _FORMULA_PREFIXES or (stripped and stripped[0] in _TRIMMED_FORMULA_PREFIXES):
        return f"'{value}"
    return value


def sanitize_csv_row(values: Iterable[Any]) -> list[Any]:
    """Làm sạch toàn bộ một dòng CSV trước khi ghi qua `csv.writer`.

    Args:
        values: Danh sách giá trị cột trong dòng.

    Returns:
        Danh sách giá trị đã trung hòa công thức.
    """
    return [sanitize_csv_cell(item) for item in values]
