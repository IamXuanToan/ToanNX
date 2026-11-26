"""Repository Dịch vụ & Gói đăng ký định kỳ."""

from datetime import date
from decimal import Decimal
from typing import Any

from django.db.models import QuerySet, Sum, Value
from django.db.models.functions import Coalesce

from app.core.repositories.core_repository import CoreRepository
from app.workspace.models.subscription import Subscription


class SubscriptionRepository(CoreRepository[Subscription]):
    """Truy xuất gói dịch vụ định kỳ."""

    model = Subscription

    def get_queryset(self) -> QuerySet[Subscription]:
        """Nạp trước owner và tiền tệ."""
        return super().get_queryset().select_related("owner", "currency")

    def list_upcoming_for_owner(
        self, owner_id: Any, start_date: date, end_date: date, *, limit: int | None = None
    ) -> tuple[list[Subscription], int]:
        """Danh sách dịch vụ active sắp tới hạn gia hạn của một owner."""
        qs = (
            self.get_queryset()
            .filter(owner_id=owner_id, is_active=True, renew_date__gte=start_date, renew_date__lte=end_date)
            .order_by("renew_date")
        )
        total = qs.count()
        items = list(qs[:limit]) if limit is not None else list(qs)
        return items, total

    def list_all_active_upcoming(self, end_date: date) -> list[Subscription]:
        """Tất cả gói active có mốc gia hạn đến hết `end_date` (cho cron W4)."""
        return list(
            self.get_queryset().filter(is_active=True, renew_date__lte=end_date).order_by("renew_date")
        )

    def sum_projected_vnd(self, owner_id: Any, start_date: date, end_date: date) -> Decimal:
        """Dự kiến tiền gia hạn trong khoảng ngày."""
        agg = (
            super()
            .get_queryset()
            .filter(owner_id=owner_id, is_active=True, renew_date__gte=start_date, renew_date__lte=end_date)
            .aggregate(total=Coalesce(Sum("amount_vnd"), Value(Decimal("0"))))
        )
        return Decimal(agg["total"])
