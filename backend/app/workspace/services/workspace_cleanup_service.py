"""Dịch vụ dọn dữ liệu định kỳ của Workspace (hội thoại AI > 180 ngày)."""

from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from app.workspace.constants.workspace_defaults import ASSISTANT_HISTORY_RETENTION_DAYS
from app.workspace.repositories.assistant_conversation_repository import AssistantConversationRepository
from app.workspace.repositories.assistant_message_repository import AssistantMessageRepository


class WorkspaceCleanupService:
    """Dọn bản ghi tin nhắn cũ trong transaction để giữ Neon DB dưới 1 GB."""

    def __init__(
        self,
        message_repository: AssistantMessageRepository | None = None,
        conversation_repository: AssistantConversationRepository | None = None,
    ) -> None:
        """Khởi tạo các repository cần dọn dẹp."""
        self.message_repository = message_repository or AssistantMessageRepository()
        self.conversation_repository = conversation_repository or AssistantConversationRepository()

    @transaction.atomic
    def purge_old_assistant_history(self) -> int:
        """Xóa cứng tin nhắn và hội thoại AI không hoạt động quá `ASSISTANT_HISTORY_RETENTION_DAYS` ngày."""
        cutoff = timezone.now() - timedelta(days=ASSISTANT_HISTORY_RETENTION_DAYS)
        removed = self.message_repository.hard_delete_where(created_at__lt=cutoff)
        removed += self.conversation_repository.hard_delete_where(last_message_at__lt=cutoff)
        return removed
