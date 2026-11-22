"""Giao dịch SePay đã đọc từ webhook hoặc API (dạng chung trước khi ghi `Income`)."""

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Any


@dataclass(frozen=True)
class IncomingSepayTransaction:
    """`amount` None khi không đọc được số tiền (lưu dạng UNKNOWN, lý do ở `problem`)."""

    sepay_id: str
    received_at: datetime
    amount: Decimal | None
    content: str
    reference_code: str = ""
    bank_name: str = ""
    account_number: str = ""
    problem: str = ""
    payload: dict[str, Any] = field(default_factory=dict)
