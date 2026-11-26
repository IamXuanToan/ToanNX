"""Repository nơi nhận Telegram."""

from app.core.repositories.core_repository import CoreRepository
from app.system.models.telegram_chat import TelegramChat


class TelegramChatRepository(CoreRepository[TelegramChat]):
    """Truy cập dữ liệu TelegramChat."""

    model = TelegramChat
