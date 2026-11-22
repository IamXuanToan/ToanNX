"""Hóa đơn / chứng từ: file private bắt buộc, gắn giao dịch của mình, quy VNĐ, đối chiếu."""

from decimal import Decimal
from typing import Any

from django.db import transaction

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.services.core_crud_service import CoreCrudService
from app.finance.constants.finance_choices import RateSource
from app.finance.constants.finance_error_code import FinanceErrorCode
from app.finance.models.invoice import Invoice
from app.finance.permissions.invoice_permission import InvoicePermission
from app.finance.repositories.income_repository import IncomeRepository
from app.finance.repositories.invoice_repository import InvoiceRepository
from app.finance.services.currency_converter import CurrencyConverter
from app.finance.services.platform_service import PlatformService
from app.system.constants.currency_error_code import CurrencyErrorCode
from app.system.models.attachment import Attachment
from app.system.services.attachment_service import AttachmentService
from app.system.services.currency_service import CurrencyService
from app.system.services.exchange_rate_service import ExchangeRateService

AMOUNT_FIELDS = (
    "currency_id",
    "original_amount",
    "original_tax_amount",
    "rate_source",
    "exchange_rate",
    "issued_on",
)


class InvoiceService(CoreCrudService[Invoice, InvoiceRepository]):
    """Không ảnh hưởng số báo cáo."""

    repository_class = InvoiceRepository
    owner_field = "owner"
    manage_all_permission = InvoicePermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: InvoiceRepository | None = None,
        income_repository: IncomeRepository | None = None,
        platform_service: PlatformService | None = None,
        currency_service: CurrencyService | None = None,
        exchange_rate_service: ExchangeRateService | None = None,
        attachment_service: AttachmentService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        super().__init__(repository or InvoiceRepository())
        self.income_repository = income_repository or IncomeRepository()
        self.platform_service = platform_service or PlatformService()
        self.currency_service = currency_service or CurrencyService()
        self.exchange_rate_service = exchange_rate_service or ExchangeRateService()
        self.attachment_service = attachment_service or AttachmentService()
        self.converter = CurrencyConverter()

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> Invoice:
        """Tạo chứng từ + file + giao dịch."""
        data = dict(data)
        attachment_ids = data.pop("attachment_ids", [])
        income_ids = data.pop("income_ids", [])
        self._validate(actor, data, None)
        fields = {**data, **self._amounts(data)}
        invoice = super().create(actor, fields)
        self._sync_relations(actor, invoice, attachment_ids, income_ids)
        return invoice

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Invoice:
        """Sửa; gửi `attachment_ids`/`income_ids` thì đồng bộ lại."""
        invoice = self.get_for_write(actor, pk)
        data = dict(data)
        attachment_ids = data.pop("attachment_ids", None)
        income_ids = data.pop("income_ids", None)
        merged = {
            "doc_type": invoice.doc_type,
            "issuer": invoice.issuer,
            "number": invoice.number,
            "period_from": invoice.period_from,
            "period_to": invoice.period_to,
            "currency_id": invoice.currency_id,
            "original_amount": invoice.original_amount,
            "original_tax_amount": invoice.original_tax_amount,
            "rate_source": invoice.rate_source,
            "exchange_rate": invoice.exchange_rate,
            "issued_on": invoice.issued_on,
            **data,
        }
        self._validate(actor, merged, invoice.pk)
        fields = dict(data)
        if any(key in data for key in AMOUNT_FIELDS):
            fields.update(self._amounts(merged))
        invoice = self.repository.update(invoice, actor=actor, **fields)
        self._sync_relations(actor, invoice, attachment_ids, income_ids)
        return invoice

    def reconciliation(self, invoice: Invoice) -> dict[str, Decimal]:
        """Tổng N/T/G của giao dịch gắn (chưa xóa) so với chứng từ (chỉ hiển thị)."""
        incomes = list(invoice.incomes.all())
        amount = sum((item.amount or Decimal(0) for item in incomes), Decimal(0))
        tax = sum((item.tax_amount or Decimal(0) for item in incomes if item.tax_withheld), Decimal(0))
        gross = sum((item.gross_amount or Decimal(0) for item in incomes), Decimal(0))
        return {
            "income_count": Decimal(len(incomes)),
            "income_amount": amount,
            "income_tax_amount": tax,
            "income_gross_amount": gross,
            "gross_difference": invoice.amount - gross,
            "tax_difference": (invoice.tax_amount or Decimal(0)) - tax,
        }

    def _validate(self, actor: Any, data: dict[str, Any], exclude_id: Any) -> None:
        if data.get("period_from") and data.get("period_to") and data["period_from"] > data["period_to"]:
            raise BusinessRuleError("Kỳ không hợp lệ.", code=FinanceErrorCode.INVOICE_PERIOD_INVALID)
        if data.get("number") and self.repository.exists_number(
            actor.pk, data["doc_type"], data["issuer"], data["number"], exclude_id
        ):
            raise BusinessRuleError("Đã có chứng từ cùng số.", code=FinanceErrorCode.INVOICE_DUPLICATE)
        if data.get("platform_id"):
            self.platform_service.get_usable(actor, data["platform_id"])
        tax = data.get("original_tax_amount")
        if tax is not None and Decimal(tax) > Decimal(data["original_amount"]):
            raise BusinessRuleError(
                "Tiền thuế lớn hơn tổng tiền.", code=FinanceErrorCode.INVOICE_PERIOD_INVALID
            )

    def _amounts(self, data: dict[str, Any]) -> dict[str, Any]:
        """Quy VNĐ theo ngày lập (BASE / API / MANUAL)."""
        currency = self.currency_service.get_active(data["currency_id"])
        original = self.converter.round_original(Decimal(data["original_amount"]), currency.decimal_places)
        tax_raw = data.get("original_tax_amount")
        original_tax = (
            self.converter.round_original(Decimal(tax_raw), currency.decimal_places)
            if tax_raw is not None
            else None
        )
        if currency.is_base:
            rate, source, rate_date = Decimal(1), RateSource.BASE, None
        elif data.get("rate_source") == RateSource.MANUAL:
            if not data.get("exchange_rate"):
                raise BusinessRuleError("Nhập tỷ giá.", code=FinanceErrorCode.EXCHANGE_RATE_UNAVAILABLE)
            rate, source, rate_date = Decimal(data["exchange_rate"]), RateSource.MANUAL, data["issued_on"]
        else:
            try:
                fetched = self.exchange_rate_service.resolve(currency, data["issued_on"])
            except BusinessRuleError as exc:
                if exc.code == CurrencyErrorCode.RATE_UNAVAILABLE:
                    raise BusinessRuleError(
                        str(exc.message), code=FinanceErrorCode.EXCHANGE_RATE_UNAVAILABLE
                    ) from exc
                raise
            rate, source, rate_date = fetched.rate, RateSource.API, fetched.rate_date
        return {
            "original_amount": original,
            "original_tax_amount": original_tax,
            "exchange_rate": rate,
            "rate_source": source,
            "rate_date": rate_date,
            "amount": self.converter.to_vnd(original, rate),
            "tax_amount": self.converter.to_vnd(original_tax, rate) if original_tax is not None else None,
        }

    def _sync_relations(
        self, actor: Any, invoice: Invoice, attachment_ids: list[Any] | None, income_ids: list[Any] | None
    ) -> None:
        if attachment_ids is not None:
            if not attachment_ids:
                raise BusinessRuleError(
                    "Cần ít nhất một file.", code=FinanceErrorCode.INVOICE_ATTACHMENT_REQUIRED
                )
            # Chứng từ luôn ở kho riêng tư: file đang công khai được chuyển sang (kiểm luôn quyền với file).
            attachments = [
                self.attachment_service.set_visibility(actor, pk, Attachment.Visibility.PRIVATE)
                for pk in attachment_ids
            ]
            self.repository.set_attachments(invoice, attachments)
        if income_ids is not None:
            incomes = list(self.income_repository.filter(pk__in=income_ids, owner_id=invoice.owner_id))
            if len(incomes) != len(set(income_ids)):
                raise BusinessRuleError(
                    "Giao dịch không hợp lệ.", code=FinanceErrorCode.INVOICE_INCOME_INVALID
                )
            self.repository.set_incomes(invoice, incomes)
