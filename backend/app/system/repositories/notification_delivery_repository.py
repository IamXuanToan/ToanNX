"""Repository outbox thông báo."""

from typing import Any

from django.db.models import Min, Q, QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.system.models.notification_delivery import NotificationDelivery

Status = NotificationDelivery.Status


class NotificationDeliveryRepository(CoreRepository[NotificationDelivery]):
    """Truy cập dữ liệu NotificationDelivery."""

    model = NotificationDelivery

    def get_queryset(self) -> QuerySet[NotificationDelivery]:
        """Kèm thông báo và người nhận (serializer, gửi)."""
        return super().get_queryset().select_related("notification", "notification__recipient")

    def due_ids(self, now: Any, max_attempts: int, limit: int) -> list[Any]:
        """Id bản chờ gửi đã đến hạn, chưa quá số lần."""
        return list(
            self.get_queryset()
            .filter(status=Status.PENDING, attempts__lt=max_attempts)
            .filter(Q(next_attempt_at__isnull=True) | Q(next_attempt_at__lte=now))
            .order_by("created_at")
            .values_list("pk", flat=True)[:limit]
        )

    def next_due_at(self, now: Any, max_attempts: int) -> Any | None:
        """Mốc sớm nhất còn bản chờ gửi (bản chưa hẹn giờ = `now`); None khi hết việc."""
        pending = self.get_queryset().filter(status=Status.PENDING, attempts__lt=max_attempts)
        if pending.filter(next_attempt_at__isnull=True).exists():
            return now
        return pending.aggregate(value=Min("next_attempt_at"))["value"]

    def lock_pending(self, pk: Any) -> NotificationDelivery | None:
        """Khóa một bản còn PENDING (bỏ qua nếu tiến trình khác đang giữ) — gọi trong transaction."""
        return (
            self.get_queryset()
            .select_for_update(skip_locked=True, of=("self",))
            .filter(pk=pk, status=Status.PENDING)
            .first()
        )
