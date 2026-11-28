"""Repository Chủ đề nhắc việc."""

from typing import Any

from django.db.models import Q, QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.workspace.models.reminder_topic import ReminderTopic


class ReminderTopicRepository(CoreRepository[ReminderTopic]):
    """Truy xuất chủ đề mặc định hệ thống (`owner=None`) và chủ đề riêng của user."""

    model = ReminderTopic

    def get_queryset(self) -> QuerySet[ReminderTopic]:
        """Nạp trước owner và sắp xếp theo thứ tự + tên."""
        return super().get_queryset().select_related("owner").order_by("sort_order", "name")

    def list_for_actor(self, owner_id: Any) -> QuerySet[ReminderTopic]:
        """Danh sách chủ đề hệ thống dùng chung + chủ đề riêng của `owner_id`."""
        return self.get_queryset().filter(Q(owner_id=owner_id) | Q(owner__isnull=True))

    def find_usable_for_actor(self, owner_id: Any, topic_id: Any) -> ReminderTopic | None:
        """Tìm chủ đề còn sống thuộc hệ thống hoặc thuộc `owner_id`."""
        return self.list_for_actor(owner_id).filter(pk=topic_id).first()

    def find_by_name_for_actor(self, owner_id: Any, name: str) -> ReminderTopic | None:
        """Tìm chủ đề theo tên (không phân biệt hoa thường) cho AI tool."""
        cleaned = name.strip()
        if not cleaned:
            return None
        return (
            self.list_for_actor(owner_id)
            .filter(Q(name__iexact=cleaned) | Q(name__icontains=cleaned))
            .order_by("owner_id", "sort_order")
            .first()
        )
