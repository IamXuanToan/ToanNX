"""Nội dung một thông báo truyền vào `NotificationService.notify`."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class NotificationPayload:
    """Tiêu đề/nội dung dựng sẵn (tiếng Việt) + khóa i18n để FE dịch, đường dẫn FE nội bộ, dữ liệu phụ."""

    title: str
    body: str = ""
    link: str = ""
    level: str | None = None
    message_key: str = ""
    params: dict[str, Any] = field(default_factory=dict)
    data: dict[str, Any] = field(default_factory=dict)
    expires_at: datetime | None = None
