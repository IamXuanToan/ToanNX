"""Repository Cài đặt Trợ lý & Telegram Group của từng user."""

from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.workspace.models.workspace_setting import WorkspaceSetting


class WorkspaceSettingRepository(CoreRepository[WorkspaceSetting]):
    """Truy xuất cấu hình Trợ lý cá nhân."""

    model = WorkspaceSetting

    def get_queryset(self) -> QuerySet[WorkspaceSetting]:
        """Nạp trước owner."""
        return super().get_queryset().select_related("owner")

    def find_by_owner(self, owner_id: Any) -> WorkspaceSetting | None:
        """Tìm cấu hình theo `owner_id`."""
        return self.find_one(owner_id=owner_id)

    def list_digest_enabled(self) -> list[WorkspaceSetting]:
        """Các cấu hình đang bật tóm tắt hàng ngày (cho cron W4)."""
        return list(self.get_queryset().filter(daily_digest_enabled=True))

    def list_telegram_ai_enabled(self) -> list[WorkspaceSetting]:
        """Các cấu hình đang bật trợ lý AI trên Telegram (phục vụ định tuyến tin nhắn)."""
        return list(self.get_queryset().filter(telegram_ai_enabled=True))
