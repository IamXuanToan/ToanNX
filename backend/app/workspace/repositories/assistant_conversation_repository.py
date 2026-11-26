"""Repository Hội thoại Trợ lý AI (list gọn nhẹ không prefetch messages)."""

from typing import Any

from django.db.models import Count, Q, QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.workspace.models.assistant_conversation import AssistantConversation


class AssistantConversationRepository(CoreRepository[AssistantConversation]):
    """Truy xuất phiên hội thoại; tách tải tin nhắn ra AssistantMessageRepository."""

    model = AssistantConversation

    def get_queryset(self) -> QuerySet[AssistantConversation]:
        """Chỉ select_related owner và annotate số lượng tin nhắn (không prefetch messages)."""
        return (
            super()
            .get_queryset()
            .select_related("owner")
            .annotate(message_count=Count("messages", filter=Q(messages__deleted_at__isnull=True)))
        )

    def find_for_channel(
        self, owner_id: Any, channel: str, external_chat_id: str = ""
    ) -> AssistantConversation | None:
        """Phiên hội thoại gần nhất ứng với kênh & `external_chat_id`."""
        return (
            self.get_queryset()
            .filter(owner_id=owner_id, channel=channel, external_chat_id=external_chat_id)
            .order_by("-last_message_at", "-created_at")
            .first()
        )
