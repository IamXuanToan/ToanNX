"""Kết quả gọi Telegram sendMessage."""

from dataclasses import dataclass


@dataclass(frozen=True)
class TelegramSendResult:
    """`ok`, id tin nhắn, mã lỗi ổn định, `retry_after` (429), `migrate_to_chat_id` (nâng supergroup)."""

    ok: bool
    message_id: str = ""
    error_code: str = ""
    retry_after: int | None = None
    migrate_to_chat_id: str | None = None
