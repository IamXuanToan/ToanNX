"""Nền tảng của từng người (+ tạo bộ nền tảng mẫu Facebook/YouTube/TikTok/Shopee/Donate kèm quy tắc)."""

from decimal import Decimal
from typing import Any

from django.db import transaction

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.services.core_crud_service import CoreCrudService
from app.finance.constants.default_platforms import (
    DEFAULT_PLATFORMS,
    DEFAULT_TAX_RATE_EFFECTIVE_FROM,
    DONATE_DEFAULT_COLOR,
    DONATE_DEFAULT_NAME,
    DONATE_DEFAULT_PATTERN,
    DONATE_PLATFORM_CODE,
    LEGACY_DONATION_PLATFORM_CODE,
)
from app.finance.constants.finance_error_code import FinanceErrorCode
from app.finance.models.platform import Platform
from app.finance.permissions.platform_permission import PlatformPermission
from app.finance.repositories.classification_rule_repository import ClassificationRuleRepository
from app.finance.repositories.income_repository import IncomeRepository
from app.finance.repositories.invoice_repository import InvoiceRepository
from app.finance.repositories.platform_repository import PlatformRepository
from app.finance.repositories.platform_tax_rate_repository import PlatformTaxRateRepository
from app.system.services.currency_service import CurrencyService


class PlatformService(CoreCrudService[Platform, PlatformRepository]):
    """Đã có giao dịch/hóa đơn thì không xóa, chỉ tắt."""

    repository_class = PlatformRepository
    owner_field = "owner"
    manage_all_permission = PlatformPermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: PlatformRepository | None = None,
        rule_repository: ClassificationRuleRepository | None = None,
        currency_service: CurrencyService | None = None,
        income_repository: IncomeRepository | None = None,
        invoice_repository: InvoiceRepository | None = None,
        tax_rate_repository: PlatformTaxRateRepository | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        super().__init__(repository or PlatformRepository())
        self.rule_repository = rule_repository or ClassificationRuleRepository()
        self.income_repository = income_repository or IncomeRepository()
        self.invoice_repository = invoice_repository or InvoiceRepository()
        self.tax_rate_repository = tax_rate_repository or PlatformTaxRateRepository()
        self.currency_service = currency_service or CurrencyService()

    @staticmethod
    def _normalize_color(data: dict[str, Any]) -> dict[str, Any]:
        """Chuẩn hóa mã màu HEX viết hoa nếu có trong payload."""
        if "color" in data and isinstance(data["color"], str):
            return {**data, "color": data["color"].strip().upper()}
        return data

    def create(self, actor: Any, data: dict[str, Any]) -> Platform:
        """Tiền tệ mặc định phải đang dùng."""
        self.currency_service.get_active(data["default_currency_id"])
        return super().create(actor, self._normalize_color(data))

    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Platform:
        """Đổi tiền tệ mặc định thì tiền tệ phải đang dùng."""
        if data.get("default_currency_id"):
            self.currency_service.get_active(data["default_currency_id"])
        return super().update(actor, pk, self._normalize_color(data))

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Chỉ xóa nền tảng chưa dùng."""
        platform = self.get_for_write(actor, pk)
        if self.income_repository.exists(platform_id=platform.pk) or self.invoice_repository.exists(
            platform_id=platform.pk
        ):
            raise BusinessRuleError(
                "Nền tảng đã được dùng, hãy tắt thay vì xóa.", code=FinanceErrorCode.PLATFORM_IN_USE
            )
        self.repository.delete(platform, actor=actor)

    def get_usable(self, actor: Any, pk: Any) -> Platform:
        """Nền tảng actor được dùng để gắn vào giao dịch/hóa đơn/quy tắc."""
        platform = self.repository.find_by_id(pk)
        if platform is None or not self.can_access(actor, platform):
            raise BusinessRuleError("Nền tảng không hợp lệ.", code=FinanceErrorCode.PLATFORM_INVALID)
        return platform

    def _ensure_donate_tax_rate(self, actor: Any, platform: Platform) -> None:
        """Đảm bảo nền tảng Donate có mốc mặc định không khấu trừ tại nguồn (0%)."""
        if self.tax_rate_repository.for_platform(platform.pk).exists():
            return
        self.tax_rate_repository.create(
            actor=actor,
            platform=platform,
            effective_from=DEFAULT_TAX_RATE_EFFECTIVE_FROM,
            tax_withheld=False,
            rate=Decimal("0.00"),
            note="Mốc mặc định 0% (không khấu trừ tại nguồn) cho nguồn Donate.",
        )

    @transaction.atomic
    def seed_defaults(self, owner: Any) -> int:
        """Tạo nền tảng + quy tắc mẫu chưa có (theo `code`) cho một người; Donate có sẵn mốc thuế 0%.

        Returns:
            Số nền tảng mới tạo.
        """
        currency = self.currency_service.base()
        created = 0
        for item in DEFAULT_PLATFORMS:
            existing = self.repository.find_one(owner=owner, code=item["code"])
            if existing is not None:
                if not existing.color and item.get("color"):
                    existing = self.repository.update(existing, actor=owner, color=item["color"])
                if item["code"] == DONATE_PLATFORM_CODE:
                    self._ensure_donate_tax_rate(owner, existing)
                continue
            platform = self.repository.create(
                actor=owner,
                owner=owner,
                name=item["name"],
                code=item["code"],
                color=item.get("color", ""),
                default_currency=currency,
            )
            self.rule_repository.create(
                actor=owner,
                owner=owner,
                name=f"Nhận diện {item['name']}",
                platform=platform,
                pattern=item["pattern"],
            )
            if item["code"] == DONATE_PLATFORM_CODE:
                self._ensure_donate_tax_rate(owner, platform)
            created += 1
        return created

    @transaction.atomic
    def get_or_create_sepay_donation_platform(self, owner: Any) -> Platform:
        """Lấy hoặc tạo nền tảng `donate` (tương thích bản cũ `sepay_donation`) cho chủ trang Donate."""
        existing = self.repository.find_one(owner=owner, code=DONATE_PLATFORM_CODE)
        if existing is None:
            existing = self.repository.find_one(owner=owner, code=LEGACY_DONATION_PLATFORM_CODE)
        if existing is not None:
            if not existing.color:
                existing = self.repository.update(existing, actor=owner, color=DONATE_DEFAULT_COLOR)
            self._ensure_donate_tax_rate(owner, existing)
            return existing
        currency = self.currency_service.base()
        platform = self.repository.create(
            actor=owner,
            owner=owner,
            code=DONATE_PLATFORM_CODE,
            name=DONATE_DEFAULT_NAME,
            color=DONATE_DEFAULT_COLOR,
            default_currency=currency,
        )
        self.rule_repository.create(
            actor=owner,
            owner=owner,
            name=f"Nhận diện {DONATE_DEFAULT_NAME}",
            platform=platform,
            pattern=DONATE_DEFAULT_PATTERN,
        )
        self._ensure_donate_tax_rate(owner, platform)
        return platform
