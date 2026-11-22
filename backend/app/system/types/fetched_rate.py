"""Tỷ giá tra được cho một ngày."""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(frozen=True)
class FetchedRate:
    """`rate_date` có thể sớm hơn ngày hỏi (lùi qua ngày nghỉ)."""

    rate: Decimal
    rate_date: date
    source: str
