"""Kết quả gửi một tin Firebase Cloud Messaging."""

from dataclasses import dataclass


@dataclass(frozen=True)
class PushSendResult:
    """`permanent` = lỗi không thử lại (token hết hạn/sai) → tắt thiết bị."""

    ok: bool
    message_id: str = ""
    error_code: str = ""
    permanent: bool = False
