"""Repository nơi nhận Telegram."""

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.system.models.telegram_chat import TelegramChat


class TelegramChatRepository(CoreRepository[TelegramChat]):
    """Truy cập dữ liệu TelegramChat."""

    model = TelegramChat

    def get_queryset(self) -> QuerySet[TelegramChat]:
        """Kèm bot để gửi."""
        return super().get_queryset().select_related("bot")
