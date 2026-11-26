"""Định dạng phản hồi Telegram HTML an toàn, cắt đoạn dài & hỗ trợ gửi DM kèm phát hiện lỗi 403."""

import html

from app.system.services.telegram_bot_service import TelegramBotService
from app.system.services.telegram_client import TelegramClient
from app.system.types.telegram_send_result import TelegramSendResult

MAX_TELEGRAM_CHARS = 3800


class TelegramAssistantReplyService:
    """Gửi câu trả lời của Trợ lý AI về Telegram chat/DM qua Bot hệ thống chung."""

    def __init__(
        self,
        bot_service: TelegramBotService | None = None,
        client: TelegramClient | None = None,
    ) -> None:
        """Khởi tạo service đọc token Bot chung và Telegram HTTP client."""
        self.bot_service = bot_service or TelegramBotService()
        self.client = client or TelegramClient()

    def send_reply(
        self,
        chat_id: str | int,
        text: str,
        *,
        reply_to_message_id: int | None = None,
        model_used: str = "",
    ) -> TelegramSendResult:
        """Escape HTML an toàn, gắn nhãn model nhỏ nếu cần và gửi qua Telegram Bot API."""
        if not self.bot_service.is_configured():
            return TelegramSendResult(ok=False, error_code="TELEGRAM_BOT_MISSING")

        token = self.bot_service.token()
        body = html.escape(text or "")
        if model_used and model_used not in ("slash", "fallback"):
            body = f"{body}\n\n<i>🤖 {html.escape(model_used)}</i>"

        chunks = self._split_chunks(body)
        last_result = TelegramSendResult(ok=True)
        for idx, chunk in enumerate(chunks):
            reply_id = reply_to_message_id if idx == 0 else None
            last_result = self.client.send_message(
                token,
                str(chat_id),
                chunk,
                reply_to_message_id=reply_id,
            )
            if not last_result.ok:
                return last_result
        return last_result

    def send_private_dm_with_fallback(
        self,
        *,
        dm_chat_id: int,
        group_chat_id: str | int,
        group_reply_to_message_id: int | None,
        private_text: str,
        model_used: str = "",
    ) -> TelegramSendResult:
        """Gửi chi tiết riêng tư qua DM; nếu `403` do chưa `/start` DM → hướng dẫn ngắn tại Group."""
        dm_result = self.send_reply(dm_chat_id, private_text, model_used=model_used)
        if dm_result.ok:
            return self.send_reply(
                group_chat_id,
                "🔒 Đã gửi thông tin riêng tư vào tin nhắn riêng (DM) của bạn.",
                reply_to_message_id=group_reply_to_message_id,
            )

        info = self.bot_service.bot_info()
        bot_url = str(info.get("bot_url") or "").strip()
        hint = (
            f"Bạn cần bấm Start với bot tại {bot_url} để nhận chi tiết riêng tư qua DM."
            if bot_url
            else "Bạn cần mở chat riêng (DM) và bấm Start với bot trước để nhận chi tiết."
        )
        return self.send_reply(
            group_chat_id,
            f"⚠️ Chưa gửi được DM riêng tư. {hint}",
            reply_to_message_id=group_reply_to_message_id,
        )

    def _split_chunks(self, text: str) -> list[str]:
        if len(text) <= MAX_TELEGRAM_CHARS:
            return [text]
        chunks: list[str] = []
        remaining = text
        while remaining:
            chunks.append(remaining[:MAX_TELEGRAM_CHARS])
            remaining = remaining[MAX_TELEGRAM_CHARS:]
        return chunks
