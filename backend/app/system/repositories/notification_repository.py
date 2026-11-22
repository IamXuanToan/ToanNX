"""Repository thông báo trong chuông."""

from typing import Any

from django.db.models import Count, Q, QuerySet
from django.utils import timezone

from app.core.repositories.core_repository import CoreRepository
from app.system.constants.notification_scope import NotificationScope
from app.system.models.notification import Notification


class NotificationRepository(CoreRepository[Notification]):
    """Truy cập dữ liệu Notification (không xóa mềm: đọc/ẩn là xóa cứng)."""

    model = Notification

    def visible_for(self, user_id: Any) -> QuerySet[Notification]:
        """Thông báo chưa hết hạn của một người, mới nhất trước."""
        now = timezone.now()
        return (
            self.get_queryset()
            .filter(recipient_id=user_id)
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
            .order_by("-created_at", "-pk")
        )

    def unread_counts(self, user_id: Any) -> dict[str, int]:
        """Số chưa đọc theo tab (một truy vấn, dùng index chuông)."""
        rows = (
            self.visible_for(user_id)
            .filter(read_at__isnull=True)
            .order_by()  # bỏ sắp xếp để GROUP BY chỉ theo scope
            .values("scope")
            .annotate(total=Count("id"))
        )
        counts = {NotificationScope.PERSONAL.value: 0, NotificationScope.SYSTEM.value: 0}
        for row in rows:
            counts[row["scope"]] = row["total"]
        return counts

    def existing_recipient_ids(self, event_code: str, dedup_key: str, user_ids: list[Any]) -> set[Any]:
        """Người đã có thông báo cùng sự kiện + khóa chống trùng."""
        return set(
            self.get_queryset()
            .filter(event_code=event_code, dedup_key=dedup_key, recipient_id__in=user_ids)
            .values_list("recipient_id", flat=True)
        )
