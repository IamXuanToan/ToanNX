"""Kết quả quy đổi số gốc sang VNĐ."""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class ConversionResult:
    """Số gốc đã làm tròn, tỷ giá, nguồn, ngày tỷ giá, VNĐ."""

    original_amount: Decimal
    exchange_rate: Decimal
    rate_source: str
    rate_date: date | None
    amount: Decimal
