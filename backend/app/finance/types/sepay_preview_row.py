"""Một dòng màn xem trước lấy thủ công."""

from dataclasses import dataclass
from decimal import Decimal
from typing import Any


@dataclass
class SepayPreviewRow:
    """`status`: NEW / EXISTS / CHANGED / INVALID; `existing_*` là bản đang lưu khi CHANGED."""

    sepay_id: str
    status: str
    received_at: Any
    amount: Decimal | None
    content: str
    reference_code: str
    platform_id: Any | None = None
    platform_name: str = ""
    tax_rate: Decimal | None = None
    tax_amount: Decimal | None = None
    income_id: Any | None = None
    existing_amount: Decimal | None = None
    existing_received_at: Any | None = None
    existing_content: str = ""
