"""Nội dung một thông báo truyền vào `NotificationService.notify`."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class NotificationPayload:
    """Tiêu đề/nội dung dựng sẵn (tiếng Việt) + khóa i18n để FE dịch, đường dẫn FE nội bộ, dữ liệu phụ.

    `body` ngắn gọn cho chuông và popup trình duyệt. `details` là các dòng `(nhãn có emoji, giá trị)` để
    tin Telegram/email trình bày rõ ràng (ví dụ `("💻 Thiết bị", "Chrome trên Windows")`); trống thì
    Telegram/email dùng `body`.
    """

    title: str
    body: str = ""
    link: str = ""
    level: str | None = None
    message_key: str = ""
    params: dict[str, Any] = field(default_factory=dict)
    data: dict[str, Any] = field(default_factory=dict)
    expires_at: datetime | None = None
    details: tuple[tuple[str, str], ...] = ()
