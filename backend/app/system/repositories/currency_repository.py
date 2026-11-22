"""Repository tiền tệ."""

from typing import Any

from app.core.repositories.core_repository import CoreRepository
from app.system.models.currency import Currency


class CurrencyRepository(CoreRepository[Currency]):
    """Truy cập dữ liệu Currency."""

    model = Currency

    def find_by_code(self, code: str) -> Currency | None:
        """Tiền tệ theo mã (không phân biệt hoa thường)."""
        return self.find_one(code__iexact=code)

    def is_referenced(self, currency: Currency) -> bool:
        """Có bản ghi nào (module bất kỳ, chưa xóa mềm) đang tham chiếu tiền tệ không.

        Duyệt quan hệ ngược của model nên không cần biết module nào dùng.
        """
        for relation in Currency._meta.related_objects:
            model: Any = relation.related_model
            queryset = model._default_manager.filter(**{relation.field.name: currency})
            if any(field.name == "deleted_at" for field in model._meta.concrete_fields):
                queryset = queryset.filter(deleted_at__isnull=True)
            if queryset.exists():
                return True
        return False
