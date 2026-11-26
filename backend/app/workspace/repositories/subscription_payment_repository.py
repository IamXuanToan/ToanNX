"""Repository Lịch sử thanh toán gia hạn dịch vụ định kỳ."""

from datetime import date
from decimal import Decimal
from typing import Any

from django.db.models import QuerySet, Sum, Value
from django.db.models.functions import Coalesce

from app.core.repositories.core_repository import CoreRepository
from app.workspace.models.subscription_payment import SubscriptionPayment


class SubscriptionPaymentRepository(CoreRepository[SubscriptionPayment]):
    """Truy xuất lịch sử thanh toán gia hạn."""

    model = SubscriptionPayment

    def get_queryset(self) -> QuerySet[SubscriptionPayment]:
        """Nạp trước owner, subscription, currency và biên lai đính kèm."""
        return (
            super().get_queryset().select_related("owner", "subscription", "currency", "receipt_attachment")
        )

    def sum_paid_vnd(self, owner_id: Any, start_date: date, end_date: date) -> Decimal:
        """Tổng tiền đã thanh toán gia hạn trong khoảng ngày."""
        agg = (
            super()
            .get_queryset()
            .filter(owner_id=owner_id, paid_on__gte=start_date, paid_on__lte=end_date)
            .aggregate(total=Coalesce(Sum("amount_vnd"), Value(Decimal("0"))))
        )
        return Decimal(agg["total"])
