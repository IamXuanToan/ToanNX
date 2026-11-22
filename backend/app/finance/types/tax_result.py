"""Kết quả tính khấu trừ cho một giao dịch."""

from dataclasses import dataclass
from decimal import Decimal
from typing import Any


@dataclass(frozen=True)
class TaxResult:
    """`tax_amount`/`gross_amount` None khi chưa rõ số tiền."""

    tax_status: str
    tax_withheld: bool
    tax_rate: Decimal
    tax_amount: Decimal | None
    gross_amount: Decimal | None
    tax_rate_entry: Any | None = None
