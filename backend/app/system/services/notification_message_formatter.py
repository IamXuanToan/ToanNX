"""Dựng nội dung tin Telegram (HTML) và email (chữ thường) từ một thông báo theo một khuôn thống nhất.

Khuôn Telegram:

```
🔐 <b>Có lượt đăng nhập mới</b>

💻 Thiết bị: <b>Chrome trên Windows</b>
🌐 IP: <b>162.158.108.125</b>
🕒 Thời gian: <b>18:59 · 22/11/2026</b>

👉 <a href="...">Xem chi tiết</a>
```

Dòng chi tiết lấy từ `Notification.data["details"]` (do `NotificationPayload.details` ghi); không có thì dùng
`body`.
Icon lấy từ sự kiện (`NotificationEventDefinition.icon`), không khai thì theo mức.
"""

import html
from typing import Any

from django.utils import timezone

from app.core.registry.module_registry import ModuleRegistry, module_registry
from app.system.constants.notification_defaults import TELEGRAM_MESSAGE_MAX_LENGTH
from app.system.constants.notification_level import NotificationLevel
from app.system.models.notification import Notification

LEVEL_ICONS: dict[str, str] = {
    NotificationLevel.INFO.value: "ℹ️",
    NotificationLevel.WARNING.value: "⚠️",
    NotificationLevel.ERROR.value: "🚨",
}
TIME_LABEL = "🕒 Thời gian"
TIME_FORMAT = "%H:%M · %d/%m/%Y"
LINK_LABEL = "Xem chi tiết"
# Giá trị một dòng chi tiết dài quá thì cắt (nội dung chuyển khoản, lý do lỗi...).
DETAIL_VALUE_MAX = 300


class NotificationMessageFormatter:
    """Không gọi DB: chỉ đọc thông báo đã nạp và registry sự kiện."""

    def __init__(self, registry: ModuleRegistry | None = None) -> None:
        """Khởi tạo phụ thuộc."""
        self.registry = registry or module_registry

    def telegram_html(self, notification: Notification, link: str) -> str:
        """Tin Telegram dạng HTML (`parse_mode=HTML`).

        Args:
            notification: Thông báo.
            link: Link tuyệt đối tới FE (rỗng = không có nút xem).

        Returns:
            Chuỗi HTML không quá giới hạn của Telegram.
        """
        lines = [f"{self.icon(notification)} <b>{html.escape(notification.title)}</b>", ""]
        details = self.details(notification)
        if details:
            lines += [f"{html.escape(label)}: <b>{html.escape(value)}</b>" for label, value in details]
        elif notification.body:
            lines.append(html.escape(notification.body))
        lines.append(f"{TIME_LABEL}: <b>{self.local_time(notification)}</b>")
        if link:
            lines += ["", f'👉 <a href="{html.escape(link, quote=True)}">{LINK_LABEL}</a>']
        return "\n".join(lines)[:TELEGRAM_MESSAGE_MAX_LENGTH]

    def plain_text(self, notification: Notification, link: str) -> str:
        """Nội dung email dạng chữ thường, cùng thứ tự với tin Telegram.

        Args:
            notification: Thông báo.
            link: Link tuyệt đối tới FE (rỗng = bỏ dòng xem chi tiết).

        Returns:
            Nội dung email.
        """
        details = self.details(notification)
        lines = [f"{label}: {value}" for label, value in details] if details else [notification.body]
        lines.append(f"{TIME_LABEL}: {self.local_time(notification)}")
        if link:
            lines += ["", f"{LINK_LABEL}: {link}"]
        return "\n".join(line for line in lines if line is not None)

    def icon(self, notification: Notification) -> str:
        """Emoji của sự kiện, không khai thì theo mức."""
        event = self.registry.find_notification_event(notification.event_code)
        if event is not None and event.icon:
            return event.icon
        return LEVEL_ICONS.get(str(notification.level), LEVEL_ICONS[NotificationLevel.INFO.value])

    def details(self, notification: Notification) -> list[tuple[str, str]]:
        """Các dòng `(nhãn, giá trị)` hợp lệ đã lưu cùng thông báo."""
        raw: Any = (notification.data or {}).get("details") or []
        rows: list[tuple[str, str]] = []
        for row in raw:
            if isinstance(row, (list, tuple)) and len(row) == 2 and str(row[1]).strip():
                rows.append((str(row[0]), str(row[1])[:DETAIL_VALUE_MAX]))
        return rows

    def local_time(self, notification: Notification) -> str:
        """Giờ tạo thông báo theo múi giờ hệ thống (Asia/Ho_Chi_Minh)."""
        created = notification.created_at or timezone.now()
        return timezone.localtime(created).strftime(TIME_FORMAT)
