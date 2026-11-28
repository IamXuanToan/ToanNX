"""Định dạng phản hồi Telegram HTML an toàn, cắt đoạn dài & hỗ trợ gửi DM kèm phát hiện lỗi 403."""

import html
import re
from typing import Any

from app.system.services.telegram_bot_service import TelegramBotService
from app.system.services.telegram_client import TelegramClient
from app.system.types.telegram_send_result import TelegramSendResult
from app.workspace.constants.workspace_defaults import (
    QUICK_REPLY_BUTTONS_PER_ROW,
    QUICK_REPLY_CALLBACK_PREFIX,
)

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
        quick_replies: list[dict[str, Any]] | None = None,
        quick_input: dict[str, Any] | None = None,
    ) -> TelegramSendResult:
        """Escape HTML an toàn, gắn nhãn model nhỏ nếu cần và gửi qua Telegram Bot API.

        Có lựa chọn → bàn phím inline (bấm là chọn); chỉ cần gõ tự do → `force_reply` mở sẵn ô trả lời.
        Bàn phím gắn vào đoạn cuối khi tin bị chia nhỏ.
        """
        if not self.bot_service.is_configured():
            return TelegramSendResult(ok=False, error_code="TELEGRAM_BOT_MISSING")

        token = self.bot_service.token()
        body = self._markdown_to_telegram_html(text or "")
        if model_used and model_used not in ("slash", "fallback"):
            body = f"{body}\n\n<i>🤖 {html.escape(model_used)}</i>"

        chunks = self._split_chunks(body)
        markup = self.build_reply_markup(quick_replies, quick_input)
        last_result = TelegramSendResult(ok=True)
        for idx, chunk in enumerate(chunks):
            reply_id = reply_to_message_id if idx == 0 else None
            extra = {"reply_markup": markup} if markup and idx == len(chunks) - 1 else {}
            last_result = self.client.send_message(
                token,
                str(chat_id),
                chunk,
                reply_to_message_id=reply_id,
                **extra,
            )
            if not last_result.ok:
                return last_result
        return last_result

    def build_reply_markup(
        self, quick_replies: list[dict[str, Any]] | None, quick_input: dict[str, Any] | None
    ) -> dict[str, Any] | None:
        """Bàn phím inline 2 nút/hàng (`callback_data` = `aqr:<số thứ tự>`) hoặc `force_reply` có gợi ý."""
        buttons = [
            {
                "text": str(item.get("caption") or "")[:64],
                "callback_data": f"{QUICK_REPLY_CALLBACK_PREFIX}{idx}",
            }
            for idx, item in enumerate(quick_replies or [], start=1)
            if item.get("caption")
        ]
        if buttons:
            rows = [
                buttons[start : start + QUICK_REPLY_BUTTONS_PER_ROW]
                for start in range(0, len(buttons), QUICK_REPLY_BUTTONS_PER_ROW)
            ]
            return {"inline_keyboard": rows}
        if quick_input:
            return {
                "force_reply": True,
                "selective": True,
                "input_field_placeholder": str(quick_input.get("placeholder") or "")[:64],
            }
        return None

    def acknowledge_choice(
        self, callback_query_id: str, chat_id: str, message_id: int | None, label: str
    ) -> None:
        """Tắt vòng xoay trên nút, báo "Đã chọn …" và gỡ bàn phím khỏi câu hỏi đã trả lời."""
        if not self.bot_service.is_configured():
            return
        token = self.bot_service.token()
        self.client.answer_callback_query(token, callback_query_id, f"Đã chọn: {label}")
        if message_id is not None:
            self.client.clear_inline_keyboard(token, chat_id, message_id)

    def reject_choice(self, callback_query_id: str, text: str) -> None:
        """Báo người bấm không có quyền chọn (VD thành viên khác trong nhóm)."""
        if self.bot_service.is_configured():
            self.client.answer_callback_query(self.bot_service.token(), callback_query_id, text)

    def delete_user_message(self, chat_id: str, message_id: int) -> bool:
        """Xóa tin người dùng vừa gõ giá trị bí mật (mật khẩu) khỏi khung chat Telegram nếu bot có quyền."""
        if not self.bot_service.is_configured():
            return False
        return self.client.delete_message(self.bot_service.token(), chat_id, message_id)

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

    def _markdown_to_telegram_html(self, text: str) -> str:
        """Chuyển Markdown phổ biến của LLM sang thẻ HTML chuẩn của Telegram Bot API."""
        placeholders: dict[str, str] = {}

        def store(rendered: str) -> str:
            key = f"\x00TGPH{len(placeholders)}\x00"
            placeholders[key] = rendered
            return key

        def replace_fenced(match: re.Match[str]) -> str:
            code = html.escape(match.group(1).strip("\r\n"))
            return store(f"<pre>{code}</pre>")

        def replace_inline(match: re.Match[str]) -> str:
            return store(f"<code>{html.escape(match.group(1))}</code>")

        working = re.sub(r"```[a-zA-Z0-9_-]*\n([\s\S]*?)```", replace_fenced, text)
        working = re.sub(r"`([^`\n]+)`", replace_inline, working)
        working = html.escape(working)

        working = re.sub(
            r"\[([^\]]+)\]\((https?://[^\s)]+)\)",
            lambda m: store(f'<a href="{html.escape(m.group(2), quote=True)}">{m.group(1)}</a>'),
            working,
        )
        working = re.sub(r"^#{1,6}\s+(.+)$", r"<b>\1</b>", working, flags=re.MULTILINE)
        working = re.sub(r"^&gt;\s?(.*)$", r"<blockquote>\1</blockquote>", working, flags=re.MULTILINE)
        working = working.replace("</blockquote>\n<blockquote>", "\n")
        working = re.sub(r"^[-*]\s+(.+)$", r"• \1", working, flags=re.MULTILINE)
        working = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", working)
        working = re.sub(r"__(.+?)__", r"<b>\1</b>", working)
        working = re.sub(r"~~(.+?)~~", r"<s>\1</s>", working)
        working = re.sub(r"(?<!\*)\*(?!\s)([^*\n]+?)(?<!\s)\*(?!\*)", r"<i>\1</i>", working)

        for key, rendered in placeholders.items():
            working = working.replace(key, rendered)
        return working

    def _split_chunks(self, text: str) -> list[str]:
        if len(text) <= MAX_TELEGRAM_CHARS:
            return [text]
        chunks: list[str] = []
        remaining = text
        while remaining:
            if len(remaining) <= MAX_TELEGRAM_CHARS:
                chunks.append(remaining)
                break
            cut = remaining.rfind("\n", 0, MAX_TELEGRAM_CHARS)
            if cut <= 0:
                cut = MAX_TELEGRAM_CHARS
            chunks.append(remaining[:cut].rstrip())
            remaining = remaining[cut:].lstrip("\n")
        return chunks
