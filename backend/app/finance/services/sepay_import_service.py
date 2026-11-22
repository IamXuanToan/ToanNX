"""Lấy giao dịch thủ công qua SePay API: xem trước (NEW/EXISTS/CHANGED/INVALID) rồi chỉ nhập dòng được chọn.

Import gọi lại SePay trong cùng khoảng ngày, không tin dữ liệu client gửi. EXISTS không bao giờ bị ghi đè;
CHANGED chỉ cập nhật khi được chọn và chỉ ghi trường lấy từ SePay.
"""

from datetime import date
from typing import Any

from django.db import transaction

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.finance.constants.finance_defaults import SEPAY_IMPORT_MAX_DAYS
from app.finance.constants.finance_error_code import FinanceErrorCode
from app.finance.models.income import Income
from app.finance.services.income_service import IncomeService
from app.finance.services.sepay_api_client import SepayApiClient
from app.finance.services.sepay_connection_service import SepayConnectionService
from app.finance.services.sepay_transaction_parser import SepayTransactionParser
from app.finance.types.incoming_sepay_transaction import IncomingSepayTransaction
from app.finance.types.sepay_preview_row import SepayPreviewRow
from app.finance.utils.vn_time import vn_date

NEW, EXISTS, CHANGED, INVALID = "NEW", "EXISTS", "CHANGED", "INVALID"


class SepayImportService:
    """Dùng token SePay của chính người gọi."""

    def __init__(
        self,
        connection_service: SepayConnectionService | None = None,
        income_service: IncomeService | None = None,
        client: SepayApiClient | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        self.client = client or SepayApiClient()
        self.connection_service = connection_service or SepayConnectionService(client=self.client)
        self.income_service = income_service or IncomeService()
        self.parser = SepayTransactionParser()

    def preview(self, actor: Any, date_from: date, date_to: date) -> list[SepayPreviewRow]:
        """Giao dịch tiền vào trong khoảng + trạng thái so với dữ liệu đã lưu."""
        rows: list[SepayPreviewRow] = []
        for incoming in self._fetch(actor, date_from, date_to):
            existing = self.income_service.find_duplicate(actor, incoming)
            platform, tax = self.income_service.preview_tax(
                actor, incoming.content, incoming.amount, vn_date(incoming.received_at)
            )
            row = SepayPreviewRow(
                sepay_id=incoming.sepay_id,
                status=self._status(incoming, existing),
                received_at=incoming.received_at,
                amount=incoming.amount,
                content=incoming.content,
                reference_code=incoming.reference_code,
                platform_id=platform.pk if platform else None,
                platform_name=platform.name if platform else "",
                tax_rate=tax.tax_rate,
                tax_amount=tax.tax_amount,
            )
            if existing is not None:
                row.income_id = existing.pk
                row.existing_amount = existing.amount
                row.existing_received_at = existing.received_at
                row.existing_content = existing.content
            rows.append(row)
        return rows

    @transaction.atomic
    def import_selected(self, actor: Any, date_from: date, date_to: date, ids: list[str]) -> dict[str, int]:
        """Nhập các id được chọn: NEW/INVALID tạo mới, CHANGED cập nhật, EXISTS bỏ qua."""
        wanted = {str(item) for item in ids}
        result = {"created": 0, "updated": 0, "skipped": 0}
        seen: set[str] = set()
        connection = self.connection_service.require_for(actor)
        for incoming in self._fetch(actor, date_from, date_to):
            if incoming.sepay_id not in wanted:
                continue
            seen.add(incoming.sepay_id)
            existing = self.income_service.find_duplicate(actor, incoming)
            status = self._status(incoming, existing)
            if existing is None:
                self.income_service.ingest_sepay(actor, incoming)
                result["created"] += 1
            elif status == CHANGED:
                self.income_service.apply_sepay_change(actor, existing, incoming)
                result["updated"] += 1
            else:
                result["skipped"] += 1
        result["skipped"] += len(wanted - seen)
        self.connection_service.touch_sync(connection)
        return result

    def _fetch(self, actor: Any, date_from: date, date_to: date) -> list[IncomingSepayTransaction]:
        if date_from > date_to or (date_to - date_from).days > SEPAY_IMPORT_MAX_DAYS:
            raise BusinessRuleError(
                f"Chọn khoảng tối đa {SEPAY_IMPORT_MAX_DAYS} ngày.",
                code=FinanceErrorCode.SEPAY_RANGE_TOO_LONG,
            )
        connection = self.connection_service.require_for(actor)
        token = self.connection_service.token_for(connection)
        items = (
            self.parser.from_api(row) for row in self.client.iter_transactions(token, date_from, date_to)
        )
        return [item for item in items if item is not None]

    @staticmethod
    def _status(incoming: IncomingSepayTransaction, existing: Income | None) -> str:
        if existing is None:
            return INVALID if incoming.amount is None else NEW
        same = (
            existing.amount == incoming.amount
            and existing.received_at == incoming.received_at
            and existing.content == incoming.content
        )
        return EXISTS if same else CHANGED
