"""Đọc giao dịch SePay (payload webhook hoặc dòng API v2) thành `IncomingSepayTransaction`.

Payload webhook không có trường tiền tệ: `transferAmount` là số nguyên, đơn vị VNĐ
(https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook#payload). Vẫn kiểm phòng hờ trường `currency`.
Số tiền không đọc được thì vẫn trả giao dịch với `amount = None` + lý do (lưu dạng UNKNOWN).
"""

from decimal import Decimal, InvalidOperation
from typing import Any

from django.utils import timezone

from app.finance.types.incoming_sepay_transaction import IncomingSepayTransaction
from app.finance.utils.vn_time import parse_sepay_datetime

BASE_CURRENCY = "VND"


class SepayTransactionParser:
    """Chỉ đọc dữ liệu; không ghi DB."""

    def from_webhook(self, payload: dict[str, Any]) -> IncomingSepayTransaction:
        """Payload webhook (`transferType` đã là `in`)."""
        amount, problem = self._amount(payload.get("transferAmount"), payload.get("currency"))
        received_at = parse_sepay_datetime(payload.get("transactionDate"))
        if received_at is None:
            problem = (problem + "; " if problem else "") + "transactionDate sai định dạng, dùng giờ nhận"
            received_at = timezone.now()
        return IncomingSepayTransaction(
            sepay_id=str(payload["id"]),
            received_at=received_at,
            amount=amount,
            content=str(payload.get("content") or payload.get("description") or ""),
            reference_code=str(payload.get("referenceCode") or ""),
            bank_name=str(payload.get("gateway") or ""),
            account_number=str(payload.get("accountNumber") or ""),
            problem=problem,
            payload=payload,
        )

    def from_api(self, row: dict[str, Any]) -> IncomingSepayTransaction | None:
        """Dòng `/v2/transactions`; tiền ra hoặc thiếu id/ngày thì None."""
        received_at = parse_sepay_datetime(row.get("transaction_date"))
        if not row.get("id") or received_at is None or not self._is_incoming(row):
            return None
        amount, problem = self._amount(row.get("amount_in"), row.get("currency"))
        return IncomingSepayTransaction(
            sepay_id=str(row["id"]),
            received_at=received_at,
            amount=amount,
            content=str(row.get("transaction_content") or ""),
            reference_code=str(row.get("reference_number") or ""),
            bank_name=str(row.get("bank_brand_name") or ""),
            account_number=str(row.get("account_number") or ""),
            problem=problem,
            payload=row,
        )

    @staticmethod
    def _is_incoming(row: dict[str, Any]) -> bool:
        transfer_type = row.get("transfer_type")
        if transfer_type:
            return transfer_type == "in"
        try:
            return Decimal(str(row.get("amount_in") or 0)) > 0
        except InvalidOperation:
            return True  # Có trường tiền vào nhưng hỏng: vẫn nhận để người dùng xử lý tay.

    @staticmethod
    def _amount(raw: Any, currency: Any) -> tuple[Decimal | None, str]:
        """Số nguyên dương VNĐ; còn lại → (None, lý do)."""
        if currency not in (None, "", BASE_CURRENCY):
            return None, f"SePay trả tiền tệ chưa hỗ trợ: {currency}"
        if raw is None or isinstance(raw, bool):
            return None, "Không đọc được số tiền"
        try:
            value = Decimal(str(raw))
        except InvalidOperation:
            return None, f"Số tiền không hợp lệ: {str(raw)[:30]}"
        if value <= 0 or value != value.to_integral_value():
            return None, f"Số tiền không hợp lệ: {str(raw)[:30]}"
        return value, ""
