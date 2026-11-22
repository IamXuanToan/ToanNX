"""Định dạng tiền cho nội dung thông báo (tiếng Việt: dấu chấm phân cách nghìn)."""

from decimal import Decimal


def format_money(value: Decimal | None, symbol: str = "₫", decimals: int = 0) -> str:
    """`9200000` → `9.200.000 ₫`; `1250.5, "$", 2` → `1.250,50 $`."""
    if value is None:
        return "?"
    text = f"{value:,.{decimals}f}".replace(",", "_").replace(".", ",").replace("_", ".")
    return f"{text} {symbol}"
