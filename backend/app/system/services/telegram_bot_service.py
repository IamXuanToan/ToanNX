"""Bot Telegram dùng chung toàn hệ thống qua ENV (TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME)."""

import hashlib
import hmac
import logging
from typing import Any

from django.conf import settings
from django.utils.crypto import salted_hmac

from app.core.cache.cache_service import CacheService
from app.core.exceptions.business_rule_error import BusinessRuleError
from app.system.constants.notification_defaults import (
    TELEGRAM_BOT_INFO_CACHE_KEY,
    TELEGRAM_BOT_INFO_TTL_SECONDS,
    TELEGRAM_WEBHOOK_SECRET_SALT,
)
from app.system.constants.notification_error_code import NotificationErrorCode
from app.system.services.telegram_client import TelegramClient

logger = logging.getLogger(__name__)


class TelegramBotService:
    """Đọc token/metadata Bot chung, dẫn xuất webhook secret và đồng bộ webhook Telegram."""

    def __init__(
        self,
        client: TelegramClient | None = None,
        cache_service: CacheService | None = None,
    ) -> None:
        """Khởi tạo client Telegram và CacheService."""
        self.client = client or TelegramClient()
        self.cache_service = cache_service or CacheService()

    def is_configured(self) -> bool:
        """Đã cấu hình `TELEGRAM_BOT_TOKEN` trong biến môi trường hay chưa."""
        return bool(str(getattr(settings, "TELEGRAM_BOT_TOKEN", "") or "").strip())

    def token(self) -> str:
        """Trả token Bot chung; thiếu thì báo `TELEGRAM_BOT_MISSING`."""
        value = str(getattr(settings, "TELEGRAM_BOT_TOKEN", "") or "").strip()
        if not value:
            raise BusinessRuleError(
                "Chưa cấu hình bot Telegram hệ thống.", code=NotificationErrorCode.TELEGRAM_BOT_MISSING
            )
        return value

    def webhook_secret(self) -> str:
        """Dẫn xuất secret kiểm header `X-Telegram-Bot-Api-Secret-Token` từ `DJANGO_SECRET_KEY`."""
        if not self.is_configured():
            return ""
        token_digest = hashlib.sha256(self.token().encode("utf-8")).hexdigest()
        return salted_hmac(
            TELEGRAM_WEBHOOK_SECRET_SALT,
            token_digest,
            secret=settings.SECRET_KEY,
            algorithm="sha256",
        ).hexdigest()

    def verify_webhook_secret(self, header_secret: str) -> bool:
        """So sánh hằng thời gian header `X-Telegram-Bot-Api-Secret-Token`."""
        expected = self.webhook_secret()
        provided = (header_secret or "").strip()
        return bool(expected and provided and hmac.compare_digest(provided, expected))

    def bot_info(self) -> dict[str, Any]:
        """Metadata bot (`configured`, `username`, `display_name`, `bot_url`), ưu tiên ENV + Redis."""
        if not self.is_configured():
            return {
                "configured": False,
                "username": "",
                "display_name": "",
                "bot_url": "",
                "bot_id": "",
            }

        cached = self.cache_service.get_json(TELEGRAM_BOT_INFO_CACHE_KEY)
        if isinstance(cached, dict) and cached.get("configured") and cached.get("username"):
            return cached

        env_username = str(getattr(settings, "TELEGRAM_BOT_USERNAME", "") or "").lstrip("@").strip()
        if env_username:
            info = {
                "configured": True,
                "username": env_username,
                "display_name": env_username,
                "bot_url": f"https://t.me/{env_username}",
                "bot_id": "",
            }
            self.cache_service.set_json(TELEGRAM_BOT_INFO_CACHE_KEY, info, TELEGRAM_BOT_INFO_TTL_SECONDS)
            return info

        try:
            me = self.client.get_me(self.token())
        except BusinessRuleError:
            return {
                "configured": True,
                "username": "",
                "display_name": "",
                "bot_url": "",
                "bot_id": "",
            }
        return self._store_bot_info(me)

    def check(self, webhook_url: str = "") -> dict[str, Any]:
        """Kiểm tra `getMe`, đồng bộ `setWebhook` (nếu có URL tuyệt đối) và đọc `getWebhookInfo`."""
        token = self.token()
        me = self.client.get_me(token)
        bot = self._store_bot_info(me)
        last_error = ""
        if webhook_url and "://" in webhook_url:
            try:
                self.client.set_webhook(token, webhook_url, secret_token=self.webhook_secret())
            except BusinessRuleError as exc:
                last_error = str(exc)
        webhook = self.client.get_webhook_info(token)
        resolved_url = str(webhook.get("url") or "")
        webhook_error = str(webhook.get("last_error_message") or "")
        return {
            "bot": {
                "configured": bot["configured"],
                "username": bot["username"],
                "display_name": bot["display_name"],
                "bot_url": bot["bot_url"],
            },
            "webhook_active": bool(resolved_url),
            "webhook_url": resolved_url,
            "last_error_code": webhook_error or last_error,
        }

    def _store_bot_info(self, me: dict[str, Any]) -> dict[str, Any]:
        env_username = str(getattr(settings, "TELEGRAM_BOT_USERNAME", "") or "").lstrip("@").strip()
        username = str(me.get("username") or env_username or "").lstrip("@").strip()
        display_name = str(me.get("first_name") or username or "").strip()
        info = {
            "configured": True,
            "username": username,
            "display_name": display_name,
            "bot_url": f"https://t.me/{username}" if username else "",
            "bot_id": str(me.get("id") or ""),
        }
        self.cache_service.set_json(TELEGRAM_BOT_INFO_CACHE_KEY, info, TELEGRAM_BOT_INFO_TTL_SECONDS)
        return info
