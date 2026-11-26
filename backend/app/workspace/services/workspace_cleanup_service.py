"""Dịch vụ dọn dữ liệu định kỳ của Workspace (sự cố monitor > 90 ngày, hội thoại AI > 180 ngày)."""

from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from app.workspace.constants.workspace_defaults import (
    ASSISTANT_HISTORY_RETENTION_DAYS,
    MONITOR_INCIDENT_RETENTION_DAYS,
)
from app.workspace.repositories.assistant_conversation_repository import AssistantConversationRepository
from app.workspace.repositories.assistant_message_repository import AssistantMessageRepository
from app.workspace.repositories.monitor_incident_repository import MonitorIncidentRepository


class WorkspaceCleanupService:
    """Dọn bản ghi log cũ trong transaction để giữ Neon DB dưới 1 GB."""

    def __init__(
        self,
        incident_repository: MonitorIncidentRepository | None = None,
        message_repository: AssistantMessageRepository | None = None,
        conversation_repository: AssistantConversationRepository | None = None,
    ) -> None:
        """Khởi tạo các repository cần dọn dẹp."""
        self.incident_repository = incident_repository or MonitorIncidentRepository()
        self.message_repository = message_repository or AssistantMessageRepository()
        self.conversation_repository = conversation_repository or AssistantConversationRepository()

    @transaction.atomic
    def purge_old_monitor_incidents(self) -> int:
        """Xóa cứng sự cố monitor đã đóng quá `MONITOR_INCIDENT_RETENTION_DAYS` ngày."""
        cutoff = timezone.now() - timedelta(days=MONITOR_INCIDENT_RETENTION_DAYS)
        # Xóa cứng log sự cố monitor quá 90 ngày nhằm giữ DB gọn theo giới hạn gói free Neon.
        return self.incident_repository.hard_delete_where(resolved_at__isnull=False, resolved_at__lt=cutoff)

    @transaction.atomic
    def purge_old_assistant_history(self) -> int:
        """Xóa cứng tin nhắn và hội thoại AI không hoạt động quá `ASSISTANT_HISTORY_RETENTION_DAYS` ngày."""
        cutoff = timezone.now() - timedelta(days=ASSISTANT_HISTORY_RETENTION_DAYS)
        # Xóa cứng lịch sử tin nhắn AI quá 180 ngày nhằm bảo toàn hạn mức 1 GB của Neon Free.
        removed = self.message_repository.hard_delete_where(created_at__lt=cutoff)
        removed += self.conversation_repository.hard_delete_where(last_message_at__lt=cutoff)
        return removed
