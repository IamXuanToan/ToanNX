"""Repository Platform."""

from django.db.models import Prefetch, QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.finance.models.platform import Platform
from app.finance.models.platform_tax_rate import PlatformTaxRate


class PlatformRepository(CoreRepository[Platform]):
    """Truy cập dữ liệu Platform."""

    model = Platform

    def get_queryset(self) -> QuerySet[Platform]:
        """Kèm chủ sở hữu và tiền tệ mặc định."""
        return (
            super()
            .get_queryset()
            .select_related("owner", "default_currency")
            .prefetch_related(
                Prefetch("tax_rates", queryset=PlatformTaxRate.objects.filter(deleted_at__isnull=True))
            )
        )
