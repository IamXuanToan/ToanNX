"""Giao dịch thu nhập: nhập tay, ghi từ SePay, sửa, nhận diện lại, tính lại thuế, lấy lại tỷ giá, xuất CSV.

Thứ tự xử lý mỗi khi tạo/sửa: quy đổi VNĐ → nhận diện nền tảng → tra mốc khấu trừ theo ngày VN → chụp vào
giao dịch. Giao dịch thuế nhập tay (`is_tax_manual`) không tự tính lại.
"""

import csv
import io
from decimal import Decimal
from typing import Any

from django.db import transaction
from django.db.models import QuerySet
from django.utils import timezone

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.services.core_crud_service import CoreCrudService
from app.core.utils.csv_safety import sanitize_csv_row
from app.finance.constants.finance_choices import RateSource
from app.finance.constants.finance_defaults import NOTIFICATION_CONTENT_MAX
from app.finance.constants.finance_error_code import FinanceErrorCode
from app.finance.constants.finance_notification_event import FinanceNotificationEvent as Event
from app.finance.models.income import Income
from app.finance.permissions.income_permission import IncomePermission
from app.finance.repositories.income_repository import IncomeRepository
from app.finance.services.classification_engine import ClassificationEngine
from app.finance.services.currency_converter import CurrencyConverter
from app.finance.services.platform_service import PlatformService
from app.finance.services.platform_tax_rate_service import PlatformTaxRateService
from app.finance.services.tax_withholding_calculator import TaxWithholdingCalculator
from app.finance.types.conversion_result import ConversionResult
from app.finance.types.incoming_sepay_transaction import IncomingSepayTransaction
from app.finance.types.tax_result import TaxResult
from app.finance.utils.money_format import format_money
from app.finance.utils.vn_time import vn_date
from app.system.constants.currency_error_code import CurrencyErrorCode
from app.system.constants.notification_level import NotificationLevel
from app.system.models.currency import Currency
from app.system.services.currency_service import CurrencyService
from app.system.services.exchange_rate_service import ExchangeRateService
from app.system.services.notification_service import NotificationService
from app.system.types.notification_payload import NotificationPayload

Status = Income.TaxStatus
AmountStatus = Income.AmountStatus
INCOME_PATH = "/admin/finance/incomes/{pk}"
CONVERSION_FIELDS = ("currency_id", "original_amount", "rate_source", "exchange_rate")
TAX_INPUT_FIELDS = ("is_tax_manual", "tax_withheld", "tax_rate", "tax_amount")
CSV_HEADER = (
    "Ngày",
    "Nguồn",
    "Nền tảng",
    "Nội dung",
    "Số gốc",
    "Tiền tệ",
    "Tỷ giá",
    "Nguồn tỷ giá",
    "Thực nhận (VNĐ)",
    "Khấu trừ",
    "% khấu trừ",
    "Thuế bị khấu trừ",
    "Trước khấu trừ",
    "Trạng thái",
    "Mã giao dịch",
    "Ghi chú",
)


class IncomeService(CoreCrudService[Income, IncomeRepository]):
    """Dữ liệu theo người tạo; manager có `finance.income.manage_all` thấy tất cả."""

    repository_class = IncomeRepository
    owner_field = "owner"
    manage_all_permission = IncomePermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: IncomeRepository | None = None,
        platform_service: PlatformService | None = None,
        tax_rate_service: PlatformTaxRateService | None = None,
        engine: ClassificationEngine | None = None,
        currency_service: CurrencyService | None = None,
        exchange_rate_service: ExchangeRateService | None = None,
        notification_service: NotificationService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        super().__init__(repository or IncomeRepository())
        self.platform_service = platform_service or PlatformService()
        self.tax_rate_service = tax_rate_service or PlatformTaxRateService(income_repository=self.repository)
        self.engine = engine or ClassificationEngine()
        self.currency_service = currency_service or CurrencyService()
        self.exchange_rate_service = exchange_rate_service or ExchangeRateService()
        self.notification_service = notification_service or NotificationService()
        self.converter = CurrencyConverter()
        self.calculator = TaxWithholdingCalculator()

    # ================================================================== nhập tay
    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> Income:
        """Nhập tay: chọn nền tảng thì khóa nền tảng; không chọn thì thử nhận diện theo nội dung."""
        received_at = data["received_at"]
        day = vn_date(received_at)
        currency = self.currency_service.get_active(data["currency_id"])
        conversion = self._convert(
            currency,
            Decimal(data["original_amount"]),
            data.get("rate_source"),
            data.get("exchange_rate"),
            day,
        )
        platform, rule, locked = self._platform_for(
            actor, actor.pk, data.get("platform_id"), data.get("content", "")
        )
        tax = self._tax(conversion.amount, platform, day, data)
        income = self.repository.create(
            actor=actor,
            owner=actor,
            source=Income.Source.MANUAL,
            received_at=received_at,
            received_date=day,
            content=data.get("content", ""),
            note=data.get("note", ""),
            currency=currency,
            amount_status=AmountStatus.OK,
            platform=platform,
            matched_rule=rule,
            is_platform_locked=locked,
            is_tax_manual=bool(data.get("is_tax_manual")),
            **self._conversion_fields(conversion),
            **self._tax_fields(tax),
        )
        return income

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Income:
        """Sửa giao dịch theo quy tắc 3.4/4.5 của plan (SePay đã có số tiền thì khóa VNĐ)."""
        income = self.get_for_write(actor, pk)
        fields: dict[str, Any] = {key: data[key] for key in ("content", "note") if key in data}
        received_at = data.get("received_at", income.received_at)
        day = vn_date(received_at)
        if "received_at" in data:
            fields.update(received_at=received_at, received_date=day)
        amount = income.amount
        changed_amount = False
        if any(key in data for key in CONVERSION_FIELDS) or (
            "received_at" in data and income.rate_source == RateSource.API
        ):
            conversion_fields, amount = self._update_conversion(income, data, day)
            changed_amount = amount != income.amount or "received_at" in data
            fields.update(conversion_fields)
        platform = income.platform
        if "platform_id" in data:
            platform = (
                self.platform_service.get_usable(actor, data["platform_id"]) if data["platform_id"] else None
            )
            fields.update(platform=platform, matched_rule=None, is_platform_locked=platform is not None)
        manual = data.get("is_tax_manual", income.is_tax_manual)
        retax = (
            any(key in data for key in TAX_INPUT_FIELDS)
            or "platform_id" in data
            or "received_at" in data
            or changed_amount
            or income.amount_status != fields.get("amount_status", income.amount_status)
        )
        if retax:
            tax_input = {
                **self._stored_tax_input(income),
                **{key: data[key] for key in TAX_INPUT_FIELDS if key in data},
            }
            tax_input["is_tax_manual"] = manual
            fields.update(
                self._tax_fields(self._tax(amount, platform, day, tax_input)), is_tax_manual=bool(manual)
            )
        return self.repository.update(income, actor=actor, **fields)

    # ================================================================== SePay
    @transaction.atomic
    def find_duplicate(self, owner: Any, incoming: IncomingSepayTransaction) -> Income | None:
        """Đã có: (a) cùng id SePay; (b) cùng mã ngân hàng khác rỗng + số tiền + ngày VN."""
        existing = self.repository.find_by_sepay_id(owner.pk, incoming.sepay_id)
        if existing is None and incoming.reference_code and incoming.amount is not None:
            existing = self.repository.find_by_reference(
                owner.pk, incoming.reference_code, incoming.amount, vn_date(incoming.received_at)
            )
        return existing

    @transaction.atomic
    def ingest_sepay(self, owner: Any, incoming: IncomingSepayTransaction) -> tuple[Income, bool]:
        """Ghi một giao dịch SePay (tiền vào) cho chủ kết nối; trùng thì trả bản cũ.

        Returns:
            (giao dịch, có tạo mới không).
        """
        existing = self.find_duplicate(owner, incoming)
        if existing is not None:
            return existing, False
        day = vn_date(incoming.received_at)
        currency = self.currency_service.base()
        platform, rule, _locked = self._platform_for(owner, owner.pk, None, incoming.content)
        tax = self._tax(incoming.amount, platform, day, {})
        known = incoming.amount is not None
        income = self.repository.create(
            actor=owner,
            owner=owner,
            source=Income.Source.SEPAY,
            received_at=incoming.received_at,
            received_date=day,
            content=incoming.content,
            note=incoming.problem,
            currency=currency,
            original_amount=incoming.amount,
            exchange_rate=Decimal(1),
            rate_source=RateSource.BASE,
            amount=incoming.amount,
            amount_status=AmountStatus.OK if known else AmountStatus.UNKNOWN,
            platform=platform,
            matched_rule=rule,
            sepay_id=incoming.sepay_id,
            reference_code=incoming.reference_code,
            bank_name=incoming.bank_name,
            account_last4=incoming.account_number[-4:],
            sepay_payload=incoming.payload,
            **self._tax_fields(tax),
        )
        self._notify_new(income)
        return income, True

    @transaction.atomic
    def apply_sepay_change(self, owner: Any, income: Income, incoming: IncomingSepayTransaction) -> Income:
        """Lấy thủ công dòng CHANGED đã tích: chỉ ghi trường từ SePay, giữ nền tảng khóa/thuế tay/ghi chú."""
        day = vn_date(incoming.received_at)
        fields: dict[str, Any] = {
            "received_at": incoming.received_at,
            "received_date": day,
            "content": incoming.content,
            "reference_code": incoming.reference_code,
            "sepay_payload": incoming.payload,
            "amount": incoming.amount,
            "amount_status": AmountStatus.OK if incoming.amount is not None else AmountStatus.UNKNOWN,
        }
        if (
            income.rate_source == RateSource.BANK_ACTUAL
            and income.original_amount
            and incoming.amount is not None
        ):
            fields["exchange_rate"] = self.converter.implied_rate(incoming.amount, income.original_amount)
        else:
            fields["original_amount"] = incoming.amount
        platform = income.platform
        if not income.is_platform_locked:
            platform, rule, _locked = self._platform_for(owner, owner.pk, None, incoming.content)
            fields.update(platform=platform, matched_rule=rule)
        tax_input = {**self._stored_tax_input(income), "is_tax_manual": income.is_tax_manual}
        fields.update(self._tax_fields(self._tax(incoming.amount, platform, day, tax_input)))
        return self.repository.update(income, actor=owner, **fields)

    def preview_tax(
        self, owner: Any, content: str, amount: Decimal | None, day: Any
    ) -> tuple[Any, TaxResult]:
        """Nền tảng + khấu trừ dự kiến (màn xem trước lấy thủ công)."""
        platform, _rule, _locked = self._platform_for(owner, owner.pk, None, content)
        return platform, self._tax(amount, platform, day, {})

    # ================================================================== thao tác hàng loạt
    @transaction.atomic
    def reclassify(self, actor: Any, ids: list[Any] | None) -> int:
        """Chạy lại quy tắc (bỏ qua nền tảng đã khóa), rồi tính lại thuế không manual."""
        queryset = self.get_queryset_for(actor).filter(is_platform_locked=False)
        queryset = queryset.filter(pk__in=ids) if ids else queryset.filter(platform__isnull=True)
        changed = 0
        for income in queryset:
            match = self.engine.match(income.owner_id, income.content)
            platform = match.rule.platform if match else None
            if platform == income.platform:
                continue
            tax_input = {**self._stored_tax_input(income), "is_tax_manual": income.is_tax_manual}
            tax = self._tax(income.amount, platform, income.received_date, tax_input)
            self.repository.update(
                income,
                actor=actor,
                platform=platform,
                matched_rule=match.rule if match else None,
                **self._tax_fields(tax),
            )
            changed += 1
        return changed

    @transaction.atomic
    def recalculate_tax(self, actor: Any, ids: list[Any], reset_manual: bool) -> int:
        """Tính lại khấu trừ theo lịch sử hiện tại (sau khi sửa mốc, hoặc nút "Tính lại theo nền tảng")."""
        changed = 0
        for income in self.get_queryset_for(actor).filter(pk__in=ids):
            if income.is_tax_manual and not reset_manual:
                continue
            tax = self._tax(income.amount, income.platform, income.received_date, {})
            self.repository.update(income, actor=actor, is_tax_manual=False, **self._tax_fields(tax))
            changed += 1
        return changed

    @transaction.atomic
    def refresh_rate(self, actor: Any, pk: Any) -> Income:
        """Lấy lại tỷ giá API theo ngày nhận rồi tính lại VNĐ và thuế."""
        income = self.get_for_write(actor, pk)
        if income.rate_source != RateSource.API or income.original_amount is None:
            return income
        return self.update(
            actor, pk, {"rate_source": RateSource.API, "original_amount": income.original_amount}
        )

    def export_csv(self, queryset: QuerySet[Income]) -> str:
        """CSV đúng bộ lọc (dấu chấm thập phân, có dòng tổng)."""
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(sanitize_csv_row(CSV_HEADER))
        total = Decimal(0)
        tax_total = Decimal(0)
        for item in queryset:
            total += item.amount or 0
            tax_total += item.tax_amount or 0 if item.tax_withheld else 0
            writer.writerow(
                sanitize_csv_row(
                    (
                        item.received_date.isoformat(),
                        item.get_source_display(),
                        item.platform.name if item.platform else "",
                        item.content,
                        item.original_amount if item.original_amount is not None else "",
                        item.currency.code,
                        item.exchange_rate,
                        item.get_rate_source_display(),
                        item.amount if item.amount is not None else "",
                        "Có" if item.tax_withheld else "Không",
                        item.tax_rate,
                        item.tax_amount if item.tax_amount is not None else "",
                        item.gross_amount if item.gross_amount is not None else "",
                        item.get_tax_status_display(),
                        item.reference_code,
                        item.note,
                    )
                )
            )
        writer.writerow(
            sanitize_csv_row(
                ("Tổng", "", "", "", "", "", "", "", total, "", "", tax_total, total + tax_total, "", "", "")
            )
        )
        return buffer.getvalue()

    # ================================================================== nội bộ
    def _platform_for(
        self, actor: Any, owner_id: Any, platform_id: Any, content: str
    ) -> tuple[Any, Any, bool]:
        """(nền tảng, quy tắc khớp, đã khóa?)."""
        if platform_id:
            return self.platform_service.get_usable(actor, platform_id), None, True
        match = self.engine.match(owner_id, content)
        return (match.rule.platform, match.rule, False) if match else (None, None, False)

    def _convert(
        self, currency: Currency, original: Decimal, rate_source: str | None, manual_rate: Any, day: Any
    ) -> ConversionResult:
        """Quy đổi số gốc nhập tay (BASE / API / MANUAL)."""
        original = self.converter.round_original(original, currency.decimal_places)
        if currency.is_base:
            return ConversionResult(
                original, Decimal(1), RateSource.BASE, None, original.quantize(Decimal(1))
            )
        if rate_source == RateSource.MANUAL:
            if not manual_rate:
                raise BusinessRuleError("Nhập tỷ giá.", code=FinanceErrorCode.EXCHANGE_RATE_UNAVAILABLE)
            rate = Decimal(manual_rate)
            return ConversionResult(
                original, rate, RateSource.MANUAL, day, self.converter.to_vnd(original, rate)
            )
        try:
            fetched = self.exchange_rate_service.resolve(currency, day)
        except BusinessRuleError as exc:
            if exc.code == CurrencyErrorCode.RATE_UNAVAILABLE:
                raise BusinessRuleError(
                    str(exc.message), code=FinanceErrorCode.EXCHANGE_RATE_UNAVAILABLE
                ) from exc
            raise
        return ConversionResult(
            original,
            fetched.rate,
            RateSource.API,
            fetched.rate_date,
            self.converter.to_vnd(original, fetched.rate),
        )

    def _update_conversion(
        self, income: Income, data: dict[str, Any], day: Any
    ) -> tuple[dict[str, Any], Decimal | None]:
        """Trả (field cần ghi, VNĐ mới)."""
        currency = (
            self.currency_service.get_active(data["currency_id"])
            if data.get("currency_id")
            else income.currency
        )
        original = (
            Decimal(data["original_amount"])
            if data.get("original_amount") is not None
            else income.original_amount
        )
        if income.source == Income.Source.SEPAY and income.amount_status == AmountStatus.OK:
            return self._bank_actual(income, currency, original)
        if original is None:
            raise BusinessRuleError("Nhập số tiền.", code=FinanceErrorCode.AMOUNT_REQUIRED)
        rate_source = data.get("rate_source", income.rate_source)
        manual_rate = data.get(
            "exchange_rate", income.exchange_rate if rate_source == RateSource.MANUAL else None
        )
        conversion = self._convert(currency, original, rate_source, manual_rate, day)
        fields = {
            "currency": currency,
            "amount_status": AmountStatus.OK,
            **self._conversion_fields(conversion),
        }
        return fields, conversion.amount

    def _bank_actual(
        self, income: Income, currency: Currency, original: Decimal | None
    ) -> tuple[dict[str, Any], Decimal | None]:
        """Tiền SePay đã về VNĐ: chỉ ghi thêm số ngoại tệ gốc, VNĐ giữ nguyên."""
        if currency.is_base:
            if original is not None and original != income.amount:
                raise BusinessRuleError(
                    "Không sửa số tiền ngân hàng đã báo.", code=FinanceErrorCode.AMOUNT_LOCKED
                )
            return {
                "currency": currency,
                "original_amount": income.amount,
                "exchange_rate": Decimal(1),
                "rate_source": RateSource.BASE,
                "rate_date": None,
            }, income.amount
        if not original:
            raise BusinessRuleError("Nhập số tiền ngoại tệ gốc.", code=FinanceErrorCode.AMOUNT_REQUIRED)
        original = self.converter.round_original(original, currency.decimal_places)
        if income.amount is None:
            raise BusinessRuleError("Giao dịch chưa có số tiền.", code=FinanceErrorCode.AMOUNT_REQUIRED)
        rate = self.converter.implied_rate(income.amount, original)
        fields = {
            "currency": currency,
            "original_amount": original,
            "exchange_rate": rate,
            "rate_source": RateSource.BANK_ACTUAL,
            "rate_date": income.received_date,
        }
        return fields, income.amount

    def _tax(self, amount: Decimal | None, platform: Any, day: Any, data: dict[str, Any]) -> TaxResult:
        if data.get("is_tax_manual"):
            tax_amount = data.get("tax_amount")
            return self.calculator.manual(
                amount,
                bool(data.get("tax_withheld")),
                Decimal(data.get("tax_rate") or 0),
                Decimal(tax_amount) if tax_amount is not None else None,
            )
        entry = self.tax_rate_service.resolve(platform.pk, day) if platform is not None else None
        return self.calculator.compute(amount, entry, platform is not None)

    @staticmethod
    def _stored_tax_input(income: Income) -> dict[str, Any]:
        return {
            "tax_withheld": income.tax_withheld,
            "tax_rate": income.tax_rate,
            "tax_amount": income.tax_amount,
        }

    @staticmethod
    def _conversion_fields(conversion: ConversionResult) -> dict[str, Any]:
        return {
            "original_amount": conversion.original_amount,
            "exchange_rate": conversion.exchange_rate,
            "rate_source": conversion.rate_source,
            "rate_date": conversion.rate_date,
            "amount": conversion.amount,
        }

    @staticmethod
    def _tax_fields(tax: TaxResult) -> dict[str, Any]:
        return {
            "tax_status": tax.tax_status,
            "tax_withheld": tax.tax_withheld,
            "tax_rate": tax.tax_rate,
            "tax_amount": tax.tax_amount,
            "gross_amount": tax.gross_amount,
            "tax_rate_entry": tax.tax_rate_entry,
        }

    def _notify_new(self, income: Income) -> None:
        """Báo tiền vào (INCOME_RECEIVED) hoặc cần xử lý (NEEDS_REVIEW: không rõ tiền, chưa nhận diện...)."""
        needs_review = income.amount_status == AmountStatus.UNKNOWN or income.tax_status in (
            Status.UNCLASSIFIED,
            Status.NO_RATE,
        )
        platform = income.platform.name if income.platform else "Chưa nhận diện"
        amount = format_money(income.amount)
        title = f"Tiền vào {amount} · {platform}" if income.amount is not None else "Tiền vào chưa rõ số tiền"
        self.notification_service.notify(
            Event.INCOME_NEEDS_REVIEW if needs_review else Event.INCOME_RECEIVED,
            recipient=income.owner,
            dedup_key=f"income:{income.pk}",
            payload=NotificationPayload(
                title=title,
                body=income.content[:NOTIFICATION_CONTENT_MAX],
                link=INCOME_PATH.format(pk=income.pk),
                level=NotificationLevel.WARNING if needs_review else None,
                message_key="finance.notifications.incomeNeedsReview"
                if needs_review
                else "finance.notifications.incomeReceived",
                params={"amount": str(income.amount or ""), "platform": platform},
                data={"income_id": str(income.pk)},
                details=self._notification_details(income, amount, platform, needs_review),
            ),
        )

    @staticmethod
    def _notification_details(
        income: Income, amount: str, platform: str, needs_review: bool
    ) -> tuple[tuple[str, str], ...]:
        """Các dòng chi tiết cho tin Telegram/email (dòng trống tự bị bỏ khi hiển thị)."""
        received = (
            timezone.localtime(income.received_at).strftime("%H:%M · %d/%m/%Y") if income.received_at else ""
        )
        rows = [
            ("💵 Số tiền", amount if income.amount is not None else "Chưa đọc được"),
            ("🏷️ Nền tảng", platform),
            ("🏦 Ngân hàng", income.bank_name or ""),
            ("🔖 Mã giao dịch", income.reference_code or ""),
            ("📥 Nhận lúc", received),
            ("📝 Nội dung", income.content[:NOTIFICATION_CONTENT_MAX]),
        ]
        if needs_review:
            reason = (
                "Chưa đọc được số tiền"
                if income.amount_status == AmountStatus.UNKNOWN
                else str(Status(income.tax_status).label)
            )
            rows.append(("⚠️ Cần xử lý", reason))
        return tuple(rows)

    @transaction.atomic
    def record_donation_income(
        self,
        owner: Any,
        sepay_id: str,
        received_at: Any,
        content: str,
        amount: Decimal,
    ) -> Income:
        """Đồng bộ giao dịch quyên góp sang bảng Thu nhập của chủ trang."""
        currency = self.currency_service.base()
        platform = self.platform_service.get_or_create_sepay_donation_platform(owner)
        day = vn_date(received_at)
        fields: dict[str, Any] = {
            "source": Income.Source.SEPAY,
            "received_at": received_at,
            "received_date": day,
            "content": content,
            "currency": currency,
            "original_amount": amount,
            "amount": amount,
            "exchange_rate": Decimal("1.0"),
            "platform": platform,
            "tax_withheld": False,
            "tax_rate": Decimal("0.0"),
            "tax_amount": Decimal("0.0"),
            "amount_status": AmountStatus.OK,
            "tax_status": Status.NOT_WITHHELD,
        }
        existing = self.repository.find_by_sepay_id(owner.pk, sepay_id)
        if existing is not None:
            return self.repository.update(existing, actor=owner, **fields)
        return self.repository.create(actor=owner, owner=owner, sepay_id=sepay_id, **fields)
