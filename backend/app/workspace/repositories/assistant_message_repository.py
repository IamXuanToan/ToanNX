"""Repository Tin nhắn trong hội thoại Trợ lý AI."""

from datetime import datetime
from typing import Any

from django.db.models import QuerySet, Sum, Value
from django.db.models.functions import Coalesce

from app.core.repositories.core_repository import CoreRepository
from app.workspace.models.assistant_message import AssistantMessage


class AssistantMessageRepository(CoreRepository[AssistantMessage]):
    """Truy xuất lịch sử tin nhắn và đo mức tiêu thụ token."""

    model = AssistantMessage

    def get_queryset(self) -> QuerySet[AssistantMessage]:
        """Nạp trước conversation cha."""
        return super().get_queryset().select_related("conversation")

    def list_recent(self, conversation_id: Any, *, limit: int = 50) -> tuple[list[AssistantMessage], bool]:
        """Trả danh sách tối đa `limit` tin mới nhất theo thứ tự cũ → mới kèm cờ `has_more`."""
        qs = self.get_queryset().filter(conversation_id=conversation_id).order_by("-created_at", "-id")
        rows = list(qs[: limit + 1])
        has_more = len(rows) > limit
        items = list(reversed(rows[:limit]))
        return items, has_more

    def queryset_for_conversation(self, conversation_id: Any) -> QuerySet[AssistantMessage]:
        """QuerySet phân trang lịch sử cũ theo thứ tự mới → cũ hoặc cũ → mới cho endpoint `/messages`."""
        return self.get_queryset().filter(conversation_id=conversation_id).order_by("-created_at", "-id")

    def sum_tokens_since(self, owner_id: Any, since_dt: datetime) -> int:
        """Tổng token đã tiêu thụ của `owner` từ thời điểm `since_dt`."""
        agg = (
            super()
            .get_queryset()
            .filter(conversation__owner_id=owner_id, created_at__gte=since_dt)
            .aggregate(total=Coalesce(Sum("tokens_used"), Value(0)))
        )
        return int(agg["total"])
