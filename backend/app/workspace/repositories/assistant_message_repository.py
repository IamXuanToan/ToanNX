"""Repository Tin nhắn trong hội thoại Trợ lý AI."""

from datetime import datetime
from typing import Any

from django.db.models import Q, QuerySet, Sum, Value
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

    def visible_queryset_for_conversation(self, conversation_id: Any) -> QuerySet[AssistantMessage]:
        """QuerySet tin nhắn hiển thị (ẩn hoàn toàn bước Tool nội bộ & bong bóng rỗng)."""
        return (
            self.get_queryset()
            .filter(
                conversation_id=conversation_id,
                role__in=[AssistantMessage.Role.USER, AssistantMessage.Role.ASSISTANT],
            )
            .filter(Q(tool_calls__isnull=True) | Q(tool_calls=[]))
            .exclude(content__regex=r"^\s*$")
            .order_by("-created_at", "-id")
        )

    def list_recent_chat_turns(self, conversation_id: Any, *, limit: int = 10) -> list[AssistantMessage]:
        """Lấy tối đa `limit` lượt hỏi-đáp sạch gần nhất cho LLM (bỏ TOOL, stub rỗng và lỗi fallback)."""
        qs = self.visible_queryset_for_conversation(conversation_id).filter(is_error=False)
        return list(reversed(list(qs[:limit])))

    def queryset_for_conversation(self, conversation_id: Any) -> QuerySet[AssistantMessage]:
        """QuerySet toàn bộ bản ghi hội thoại (kể cả Tool) theo thứ tự mới → cũ."""
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
