"""Repository PlatformTaxRate."""

from datetime import date
from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.finance.models.platform_tax_rate import PlatformTaxRate


class PlatformTaxRateRepository(CoreRepository[PlatformTaxRate]):
    """Truy cập dữ liệu PlatformTaxRate."""

    model = PlatformTaxRate

    def resolve(self, platform_id: Any, day: date) -> PlatformTaxRate | None:
        """Mốc có `effective_from` lớn nhất mà `<= day`."""
        return (
            self.get_queryset()
            .filter(platform_id=platform_id, effective_from__lte=day)
            .order_by("-effective_from")
            .first()
        )

    def for_platform(self, platform_id: Any) -> QuerySet[PlatformTaxRate]:
        """Lịch sử của nền tảng, mới nhất trước."""
        return self.get_queryset().filter(platform_id=platform_id).order_by("-effective_from")
