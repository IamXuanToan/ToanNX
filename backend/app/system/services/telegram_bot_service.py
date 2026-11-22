"""Bot Telegram riêng của từng người: lưu token (mã hóa), kiểm tra bằng getMe/getWebhookInfo, xóa."""

import logging
from typing import Any

from django.db import transaction
from django.utils import timezone

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.exceptions.secret_cipher_error import SecretCipherError
from app.core.security.secret_cipher import SecretCipher
from app.system.constants.notification_defaults import TELEGRAM_TOKEN_PURPOSE
from app.system.constants.notification_error_code import NotificationErrorCode
from app.system.models.telegram_bot import TelegramBot
from app.system.repositories.telegram_bot_repository import TelegramBotRepository
from app.system.repositories.telegram_chat_repository import TelegramChatRepository
from app.system.services.telegram_client import TelegramClient

logger = logging.getLogger(__name__)
TOKEN_TAIL = 4


class TelegramBotService:
    """Mỗi người một bot; mọi thao tác chỉ trên bot của chính actor."""

    def __init__(
        self,
        repository: TelegramBotRepository | None = None,
        client: TelegramClient | None = None,
        cipher: SecretCipher | None = None,
        telegram_chat_repository: TelegramChatRepository | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        self.repository = repository or TelegramBotRepository()
        self.telegram_chat_repository = telegram_chat_repository or TelegramChatRepository()
        self.client = client or TelegramClient()
        self.cipher = cipher or SecretCipher()

    def get_for(self, actor: Any) -> TelegramBot | None:
        """Bot của actor (None nếu chưa có)."""
        return self.repository.find_one(owner_id=actor.pk)

    def require_for(self, actor: Any) -> TelegramBot:
        """Bot của actor, chưa có thì `TELEGRAM_BOT_REQUIRED`."""
        bot = self.get_for(actor)
        if bot is None or not bot.is_active:
            raise BusinessRuleError(
                "Hãy cấu hình bot Telegram trước.", code=NotificationErrorCode.TELEGRAM_BOT_REQUIRED
            )
        return bot

    @transaction.atomic
    def save(self, actor: Any, token: str) -> TelegramBot:
        """Kiểm token bằng getMe rồi lưu mã hóa (đổi token thì giữ các chat đã đăng ký nếu cùng bot).

        Raises:
            BusinessRuleError: Token sai (`TELEGRAM_BOT_TOKEN_INVALID`) hoặc không kết nối được Telegram.
        """
        token = token.strip()
        me = self.client.get_me(token)
        fields = {
            "token_encrypted": self.cipher.encrypt(TELEGRAM_TOKEN_PURPOSE, token),
            "token_last4": token[-TOKEN_TAIL:],
            "bot_id": str(me.get("id", "")),
            "username": str(me.get("username", "")),
            "display_name": str(me.get("first_name", "")),
            "is_active": True,
            "last_checked_at": timezone.now(),
            "last_error_code": "",
        }
        bot = self.get_for(actor)
        if bot is None:
            return self.repository.create(actor=actor, owner=actor, **fields)
        if bot.bot_id and bot.bot_id != fields["bot_id"]:
            # Bot khác: các chat cũ đăng ký với bot cũ không gửi được nữa.
            self.telegram_chat_repository.update_where({"is_active": False}, actor=actor, bot_id=bot.pk)
        return self.repository.update(bot, actor=actor, **fields)

    def check(self, actor: Any) -> dict[str, Any]:
        """getMe + getWebhookInfo; bot đặt webhook thì getUpdates không dùng được."""
        bot = self.require_for(actor)
        token = self.token_of(bot)
        self.client.get_me(token)
        webhook = self.client.get_webhook_info(token)
        has_webhook = bool(webhook.get("url"))
        self.repository.update(
            bot,
            last_checked_at=timezone.now(),
            last_error_code=NotificationErrorCode.TELEGRAM_BOT_HAS_WEBHOOK if has_webhook else "",
        )
        return {"bot": bot, "has_webhook": has_webhook}

    @transaction.atomic
    def delete(self, actor: Any) -> None:
        """Xóa bot (xóa cứng token) và các chat đăng ký với bot."""
        bot = self.get_for(actor)
        if bot is None:
            raise NotFoundError()
        self.repository.hard_delete(bot)

    def token_of(self, bot: TelegramBot) -> str:
        """Giải mã token; khóa đổi thì đánh dấu bot cần nhập lại và báo `TELEGRAM_BOT_TOKEN_INVALID`."""
        try:
            return self.cipher.decrypt(TELEGRAM_TOKEN_PURPOSE, bot.token_encrypted)
        except SecretCipherError as exc:
            self.mark_token_invalid(bot)
            raise BusinessRuleError(
                "Cần nhập lại token bot.", code=NotificationErrorCode.TELEGRAM_BOT_TOKEN_INVALID
            ) from exc

    def mark_token_invalid(self, bot: TelegramBot) -> None:
        """Tắt bot và ghi lỗi token để màn Hồ sơ báo cần nhập lại.

        Tắt bot để các thông báo sau không thử (và không lỗi, không sinh cảnh báo) lặp lại mỗi lần; lưu token
        mới (`save`) bật lại bot. Token giải mã lỗi thường do `DJANGO_SECRET_KEY` đã đổi.
        """
        if not bot.is_active and bot.last_error_code == NotificationErrorCode.TELEGRAM_BOT_TOKEN_INVALID:
            return
        logger.warning("Token bot Telegram %s không dùng được, đã tắt bot", bot.pk)
        self.repository.update(
            bot, is_active=False, last_error_code=NotificationErrorCode.TELEGRAM_BOT_TOKEN_INVALID
        )
