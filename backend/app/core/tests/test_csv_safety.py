"""Kiểm thử hàm làm sạch ô CSV chống công thức DDE (`app/core/utils/csv_safety.py`)."""

from decimal import Decimal

import pytest

from app.core.utils.csv_safety import sanitize_csv_cell, sanitize_csv_row


class TestCsvSafety:
    """Chặn các ký tự đầu dòng có khả năng thực thi công thức trong Excel/Sheets."""

    @pytest.mark.parametrize(
        ("raw", "expected"),
        [
            ("=cmd|'/C calc'!A0", "'=cmd|'/C calc'!A0"),
            ("+1+1", "'+1+1"),
            ("-2+3", "'-2+3"),
            ("@SUM(1+1)", "'@SUM(1+1)"),
            ("\t=1+1", "'\t=1+1"),
            ("\r=1+1", "'\r=1+1"),
            ("\n=1+1", "'\n=1+1"),
            ('  =HYPERLINK("http://evil.test")', '\'  =HYPERLINK("http://evil.test")'),
            ("SHOPEE AFFILIATE", "SHOPEE AFFILIATE"),
            ("", ""),
        ],
    )
    def test_sanitize_csv_cell_strings(self, raw: str, expected: str) -> None:
        assert sanitize_csv_cell(raw) == expected

    def test_sanitize_csv_row_preserves_numeric_types(self) -> None:
        row = sanitize_csv_row(["=1+1", 50000, Decimal("1200.50"), None, "Tổng"])
        assert row == ["'=1+1", 50000, Decimal("1200.50"), None, "Tổng"]
