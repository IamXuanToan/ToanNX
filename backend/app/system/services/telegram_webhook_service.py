"""Webhook Bot Telegram chung: xác thực secret, chống trùng update_id, kích hoạt chat & đẩy hook module."""

import logging
from typing import Any

from app.core.cache.cache_service import CacheService
from app.core.exceptions.not_found_error import NotFoundError
from app.core.registry.module_registry import ModuleRegistry, module_registry
from app.system.constants.notification_defaults import TELEGRAM_UPDATE_DEDUP_TTL_SECONDS
from app.system.services.telegram_bot_service import TelegramBotService
from app.system.services.telegram_chat_service import TelegramChatService

logger = logging.getLogger(__name__)


class TelegramWebhookService:
    """Điều phối webhook Telegram (không phụ thuộc cứng `app.workspace`)."""

    def __init__(
        self,
        telegram_bot_service: TelegramBotService | None = None,
        telegram_chat_service: TelegramChatService | None = None,
        cache_service: CacheService | None = None,
        registry: ModuleRegistry | None = None,
    ) -> None:
        """Khởi tạo các service hệ thống và registry."""
        self.telegram_bot_service = telegram_bot_service or TelegramBotService()
        self.telegram_chat_service = telegram_chat_service or TelegramChatService(
            telegram_bot_service=self.telegram_bot_service
        )
        self.cache_service = cache_service or CacheService()
        self.registry = registry or module_registry

    def process(self, header_secret: str, update: dict[str, Any]) -> dict[str, Any]:
        """Xác thực header secret rồi xử lý một bản tin Telegram update.

        Raises:
            NotFoundError: Sai secret token hoặc hệ thống chưa cấu hình bot.
        """
        if not self.telegram_bot_service.verify_webhook_secret(header_secret):
            raise NotFoundError()
        return self.dispatch_update(update)

    def dispatch_update(self, update: dict[str, Any]) -> dict[str, Any]:
        """Xử lý bản tin update (dùng chung cho cả Webhook và command polling local)."""
        if not isinstance(update, dict):
            return {"ok": True, "duplicate": False}

        update_id = update.get("update_id")
        if update_id is not None:
            dedup_key = f"system:tg:update:{update_id}"
            if not self.cache_service.set_if_absent(dedup_key, "1", TELEGRAM_UPDATE_DEDUP_TTL_SECONDS):
                return {"ok": True, "duplicate": True}

        self.telegram_chat_service.register_from_webhook_update(update)

        for handler in self.registry.telegram_update_handlers():
            try:
                handler(update)
            except Exception:  # noqa: BLE001 - không làm Telegram retry liên hoàn nếu handler module lỗi
                logger.exception("telegram.update_handler_failed update_id=%s", update_id)

        return {"ok": True, "duplicate": False}
