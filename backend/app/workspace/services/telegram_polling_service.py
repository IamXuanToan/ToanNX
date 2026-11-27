"""Service polling `getUpdates` trên máy dev local, đẩy qua cùng luồng `TelegramWebhookService`."""

import logging
import time

from app.system.services.telegram_bot_service import TelegramBotService
from app.system.services.telegram_client import TelegramClient
from app.system.services.telegram_webhook_service import TelegramWebhookService

logger = logging.getLogger(__name__)


class TelegramPollingService:
    """Chạy long-polling trên dev local để test bot Telegram 2 chiều mà không cần ngrok."""

    def __init__(
        self,
        bot_service: TelegramBotService | None = None,
        client: TelegramClient | None = None,
        webhook_service: TelegramWebhookService | None = None,
    ) -> None:
        """Khởi tạo BotService, TelegramClient và TelegramWebhookService."""
        self.bot_service = bot_service or TelegramBotService()
        self.client = client or TelegramClient()
        self.webhook_service = webhook_service or TelegramWebhookService(
            telegram_bot_service=self.bot_service
        )

    def poll_once(self, *, offset: int | None = None, timeout: int = 20) -> tuple[int | None, int]:
        """Kéo một đợt update và chuyển từng bản tin qua `TelegramWebhookService.dispatch_update`."""
        token = self.bot_service.token()
        updates = self.client.get_updates(token, offset=offset, timeout=timeout)
        next_offset = offset
        processed = 0
        for update in updates:
            update_id = update.get("update_id")
            if isinstance(update_id, int):
                next_offset = max(next_offset or 0, update_id + 1)
            self.webhook_service.dispatch_update(update)
            processed += 1
        return next_offset, processed

    def run_loop(self, *, once: bool = False, timeout: int = 20, sleep_seconds: float = 1.0) -> int:
        """Vòng lặp polling (dừng khi `once=True` hoặc KeyboardInterrupt)."""
        offset: int | None = None
        total = 0
        while True:
            offset, count = self.poll_once(offset=offset, timeout=timeout)
            total += count
            if once:
                return total
            if count == 0:
                time.sleep(sleep_seconds)
