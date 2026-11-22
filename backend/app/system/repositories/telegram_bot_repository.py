"""Repository bot Telegram."""

from app.core.repositories.core_repository import CoreRepository
from app.system.models.telegram_bot import TelegramBot


class TelegramBotRepository(CoreRepository[TelegramBot]):
    """Truy cập dữ liệu TelegramBot."""

    model = TelegramBot
