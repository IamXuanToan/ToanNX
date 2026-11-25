"""Repository Income."""

from datetime import date
from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.finance.models.income import Income


class IncomeRepository(CoreRepository[Income]):
    """Truy cập dữ liệu Income."""

    model = Income

    def get_queryset(self) -> QuerySet[Income]:
        """Kèm chủ sở hữu, nền tảng, tiền tệ, quy tắc (không N+1 khi liệt kê)."""
        return (
            super()
            .get_queryset()
            .select_related("owner", "platform", "currency", "matched_rule")
            .prefetch_related("invoices")
        )

    def find_by_sepay_id(self, owner_id: Any, sepay_id: str) -> Income | None:
        """Giao dịch đã có cùng id SePay."""
        return self.find_one(owner_id=owner_id, sepay_id=sepay_id)

    def find_by_reference(self, owner_id: Any, reference_code: str, amount: Any, day: date) -> Income | None:
        """Giao dịch cùng mã ngân hàng + số tiền + ngày (SePay gửi id khác cho cùng giao dịch)."""
        return self.find_one(
            owner_id=owner_id, reference_code=reference_code, amount=amount, received_date=day
        )

    def for_tax_recalculation(self, platform_id: Any) -> QuerySet[Income]:
        """Giao dịch tự tính thuế, đã có số tiền, của một nền tảng."""
        return self.get_queryset().filter(
            platform_id=platform_id, is_tax_manual=False, amount_status=Income.AmountStatus.OK
        )
