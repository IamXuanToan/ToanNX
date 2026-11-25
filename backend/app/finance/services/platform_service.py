"""Nền tảng của từng người (+ tạo bộ nền tảng mẫu Facebook/YouTube/TikTok/Shopee kèm quy tắc)."""

from typing import Any

from django.db import transaction

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.services.core_crud_service import CoreCrudService
from app.finance.constants.default_platforms import DEFAULT_PLATFORMS
from app.finance.constants.finance_error_code import FinanceErrorCode
from app.finance.models.platform import Platform
from app.finance.permissions.platform_permission import PlatformPermission
from app.finance.repositories.classification_rule_repository import ClassificationRuleRepository
from app.finance.repositories.income_repository import IncomeRepository
from app.finance.repositories.invoice_repository import InvoiceRepository
from app.finance.repositories.platform_repository import PlatformRepository
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
    ) -> None:
        """Khởi tạo phụ thuộc."""
        super().__init__(repository or PlatformRepository())
        self.rule_repository = rule_repository or ClassificationRuleRepository()
        self.income_repository = income_repository or IncomeRepository()
        self.invoice_repository = invoice_repository or InvoiceRepository()
        self.currency_service = currency_service or CurrencyService()

    def create(self, actor: Any, data: dict[str, Any]) -> Platform:
        """Tiền tệ mặc định phải đang dùng."""
        self.currency_service.get_active(data["default_currency_id"])
        return super().create(actor, data)

    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Platform:
        """Đổi tiền tệ mặc định thì tiền tệ phải đang dùng."""
        if data.get("default_currency_id"):
            self.currency_service.get_active(data["default_currency_id"])
        return super().update(actor, pk, data)

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

    @transaction.atomic
    def seed_defaults(self, owner: Any) -> int:
        """Tạo nền tảng + quy tắc mẫu chưa có (theo `code`) cho một người; không tạo mốc thuế.

        Returns:
            Số nền tảng mới tạo.
        """
        currency = self.currency_service.base()
        created = 0
        for item in DEFAULT_PLATFORMS:
            if self.repository.exists(owner_id=owner.pk, code=item["code"]):
                continue
            platform = self.repository.create(
                actor=owner, owner=owner, name=item["name"], code=item["code"], default_currency=currency
            )
            self.rule_repository.create(
                actor=owner,
                owner=owner,
                name=f"Nhận diện {item['name']}",
                platform=platform,
                pattern=item["pattern"],
            )
            created += 1
        return created

    @transaction.atomic
    def get_or_create_sepay_donation_platform(self, owner: Any) -> Platform:
        """Lấy hoặc tạo nền tảng `sepay_donation` mặc định cho chủ trang Donate."""
        existing = self.repository.find_one(owner=owner, code="sepay_donation")
        if existing is not None:
            return existing
        currency = self.currency_service.base()
        return self.repository.create(
            actor=owner,
            owner=owner,
            code="sepay_donation",
            name="Ủng hộ & Quyên góp SePay",
            default_currency=currency,
        )
