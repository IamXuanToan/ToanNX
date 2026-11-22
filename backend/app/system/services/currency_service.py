"""Nghiệp vụ tiền tệ: khóa tiền tệ gốc, không xóa tiền tệ đang được dùng."""

from typing import Any

from django.db import transaction

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.services.core_crud_service import CoreCrudService
from app.system.constants.currency_error_code import CurrencyErrorCode
from app.system.models.currency import Currency
from app.system.repositories.currency_repository import CurrencyRepository

LOCKED_BASE_FIELDS = ("code", "is_active", "is_base", "decimal_places")


class CurrencyService(CoreCrudService[Currency, CurrencyRepository]):
    """Tài nguyên chung (không theo owner)."""

    repository_class = CurrencyRepository

    def __init__(self, repository: CurrencyRepository | None = None) -> None:
        """Khởi tạo phụ thuộc."""
        super().__init__(repository or CurrencyRepository())

    def get_active(self, pk: Any) -> Currency:
        """Tiền tệ đang dùng (chọn trong form); tắt thì `SYSTEM_CURRENCY_INACTIVE`."""
        currency = self.repository.get_by_id(pk)
        if not currency.is_active:
            raise BusinessRuleError("Tiền tệ đang tắt.", code=CurrencyErrorCode.INACTIVE)
        return currency

    def base(self) -> Currency:
        """Tiền tệ gốc (VND)."""
        currency = self.repository.find_one(is_base=True)
        if currency is None:
            raise BusinessRuleError("Chưa có tiền tệ gốc.", code=CurrencyErrorCode.BASE_LOCKED)
        return currency

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Currency:
        """Tiền tệ gốc chỉ đổi tên/ký hiệu/thứ tự."""
        currency = self.get_for_write(actor, pk)
        if currency.is_base and any(
            field in data and data[field] != getattr(currency, field) for field in LOCKED_BASE_FIELDS
        ):
            raise BusinessRuleError(
                "Không sửa mã/trạng thái của tiền tệ gốc.", code=CurrencyErrorCode.BASE_LOCKED
            )
        return super().update(actor, pk, data)

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Không xóa tiền tệ gốc hoặc đang được dùng (chỉ tắt)."""
        currency = self.get_for_write(actor, pk)
        if currency.is_base:
            raise BusinessRuleError("Không xóa tiền tệ gốc.", code=CurrencyErrorCode.BASE_LOCKED)
        if self.repository.is_referenced(currency):
            raise BusinessRuleError(
                "Tiền tệ đang được dùng, hãy tắt thay vì xóa.", code=CurrencyErrorCode.IN_USE
            )
        self.repository.delete(currency, actor=actor)
