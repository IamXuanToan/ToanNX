"""Repository tỷ giá."""

from datetime import date
from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.system.models.exchange_rate import ExchangeRate


class ExchangeRateRepository(CoreRepository[ExchangeRate]):
    """Truy cập dữ liệu ExchangeRate."""

    model = ExchangeRate

    def get_queryset(self) -> QuerySet[ExchangeRate]:
        """Kèm tiền tệ."""
        return super().get_queryset().select_related("currency")

    def find_rate(self, currency_id: Any, rate_date: date, source: str) -> ExchangeRate | None:
        """Tỷ giá đúng ngày + nguồn."""
        return self.find_one(currency_id=currency_id, rate_date=rate_date, source=source)
