"""Lịch sử khấu trừ thuế của nền tảng: tra mốc theo ngày, thêm/sửa/xóa mốc và tìm giao dịch bị ảnh hưởng.

Đổi mốc không tự đổi giao dịch cũ (mỗi giao dịch đã chụp %); trả `affected_income_ids` để FE hỏi người dùng có
tính lại không.
"""

from datetime import date
from decimal import Decimal
from typing import Any

from django.db import transaction

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.finance.constants.finance_defaults import PERCENT
from app.finance.constants.finance_error_code import FinanceErrorCode
from app.finance.models.platform import Platform
from app.finance.models.platform_tax_rate import PlatformTaxRate
from app.finance.repositories.income_repository import IncomeRepository
from app.finance.repositories.platform_tax_rate_repository import PlatformTaxRateRepository


class PlatformTaxRateService:
    """Quyền với mốc đi theo quyền với nền tảng (nơi gọi đã kiểm nền tảng thuộc actor)."""

    def __init__(
        self,
        repository: PlatformTaxRateRepository | None = None,
        income_repository: IncomeRepository | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        self.repository = repository or PlatformTaxRateRepository()
        self.income_repository = income_repository or IncomeRepository()

    def resolve(self, platform_id: Any, day: date) -> PlatformTaxRate | None:
        """Mốc áp dụng cho ngày (giờ VN)."""
        return self.repository.resolve(platform_id, day)

    def list_for(self, platform: Platform) -> list[PlatformTaxRate]:
        """Lịch sử mới nhất trước."""
        return list(self.repository.for_platform(platform.pk))

    @transaction.atomic
    def create(
        self, actor: Any, platform: Platform, data: dict[str, Any]
    ) -> tuple[PlatformTaxRate, list[Any]]:
        """Thêm mốc; trả kèm id giao dịch có % đang chụp khác với lịch sử mới."""
        fields = self._clean(data)
        try:
            entry = self.repository.create(actor=actor, platform=platform, **fields)
        except ConflictError as exc:
            raise BusinessRuleError(
                "Đã có mốc cùng ngày.", code=FinanceErrorCode.TAX_RATE_DUPLICATE_DATE
            ) from exc
        return entry, self.affected_income_ids(platform.pk)

    @transaction.atomic
    def update(
        self, actor: Any, platform: Platform, pk: Any, data: dict[str, Any]
    ) -> tuple[PlatformTaxRate, list[Any]]:
        """Sửa mốc."""
        entry = self._get(platform, pk)
        fields = self._clean({**{"tax_withheld": entry.tax_withheld, "rate": entry.rate}, **data})
        try:
            entry = self.repository.update(entry, actor=actor, **fields)
        except ConflictError as exc:
            raise BusinessRuleError(
                "Đã có mốc cùng ngày.", code=FinanceErrorCode.TAX_RATE_DUPLICATE_DATE
            ) from exc
        return entry, self.affected_income_ids(platform.pk)

    @transaction.atomic
    def delete(self, actor: Any, platform: Platform, pk: Any) -> list[Any]:
        """Xóa mềm mốc; trả giao dịch bị ảnh hưởng."""
        self.repository.delete(self._get(platform, pk), actor=actor)
        return self.affected_income_ids(platform.pk)

    def affected_income_ids(self, platform_id: Any) -> list[Any]:
        """Giao dịch tự tính thuế có (khấu trừ, %) đang chụp khác với mốc lịch sử hiện tại cho ngày của nó."""
        entries = list(self.repository.for_platform(platform_id))
        affected: list[Any] = []
        for income in (
            self.income_repository.for_tax_recalculation(platform_id)
            .select_related(None)
            .only("pk", "received_date", "tax_withheld", "tax_rate", "tax_status")
        ):
            entry = next((item for item in entries if item.effective_from <= income.received_date), None)
            expected = (
                (entry.tax_withheld, Decimal(entry.rate))
                if entry and entry.tax_withheld
                else (False, Decimal(0))
            )
            has_entry = entry is not None
            stored_no_rate = income.tax_status == "NO_RATE"
            if (income.tax_withheld, Decimal(income.tax_rate)) != expected or stored_no_rate == has_entry:
                affected.append(income.pk)
        return affected

    def _get(self, platform: Platform, pk: Any) -> PlatformTaxRate:
        entry = self.repository.find_by_id(pk)
        if entry is None or entry.platform_id != platform.pk:
            raise NotFoundError()
        return entry

    def _clean(self, data: dict[str, Any]) -> dict[str, Any]:
        """Khấu trừ thì 0 < rate < 100; không khấu trừ thì rate = 0."""
        fields = dict(data)
        if not fields.get("tax_withheld"):
            fields["rate"] = Decimal(0)
            return fields
        rate = Decimal(fields.get("rate") or 0)
        if rate <= 0 or rate >= PERCENT:
            raise BusinessRuleError(
                "Tỷ lệ khấu trừ phải lớn hơn 0 và nhỏ hơn 100.", code=FinanceErrorCode.TAX_RATE_INVALID
            )
        return fields
