"""Định nghĩa một sự kiện thông báo do module khai báo."""

from dataclasses import dataclass, field
from typing import Literal

NotificationEventKind = Literal["business", "technical"]
NotificationScope = Literal["PERSONAL", "SYSTEM"]
NotificationAudience = Literal["OWNER", "SUBSCRIBERS"]
NotificationLevel = Literal["INFO", "WARNING", "ERROR"]
NotificationChannel = Literal["IN_APP", "PUSH", "EMAIL", "TELEGRAM"]

NOTIFICATION_SCOPE_PERSONAL: NotificationScope = "PERSONAL"
NOTIFICATION_SCOPE_SYSTEM: NotificationScope = "SYSTEM"
NOTIFICATION_AUDIENCE_OWNER: NotificationAudience = "OWNER"
NOTIFICATION_AUDIENCE_SUBSCRIBERS: NotificationAudience = "SUBSCRIBERS"
NOTIFICATION_LEVEL_INFO: NotificationLevel = "INFO"
NOTIFICATION_LEVEL_WARNING: NotificationLevel = "WARNING"
NOTIFICATION_LEVEL_ERROR: NotificationLevel = "ERROR"
NOTIFICATION_CHANNEL_IN_APP: NotificationChannel = "IN_APP"
NOTIFICATION_CHANNEL_PUSH: NotificationChannel = "PUSH"
NOTIFICATION_CHANNEL_EMAIL: NotificationChannel = "EMAIL"
NOTIFICATION_CHANNEL_TELEGRAM: NotificationChannel = "TELEGRAM"

NOTIFICATION_CHANNELS: tuple[NotificationChannel, ...] = (
    NOTIFICATION_CHANNEL_IN_APP,
    NOTIFICATION_CHANNEL_PUSH,
    NOTIFICATION_CHANNEL_EMAIL,
    NOTIFICATION_CHANNEL_TELEGRAM,
)


@dataclass(frozen=True)
class NotificationEventDefinition:
    """Sự kiện `module.resource.event` mà module có thể phát qua `NotificationService.notify`.

    Attributes:
        code: Mã sự kiện, ví dụ `finance.income.received`.
        name: Tên ngắn hiển thị ở màn cấu hình.
        description: Khi nào sự kiện được phát.
        scope: `PERSONAL` (tab Cá nhân của chuông) hoặc `SYSTEM` (tab Hệ thống).
        audience: `OWNER` (chỉ người được chỉ định lúc phát) hoặc `SUBSCRIBERS` (mọi người có quyền).
        permission: Quyền cần có để thấy, đăng ký và nhận; None = không cần quyền.
        default_level: Mức mặc định (`INFO`/`WARNING`/`ERROR`).
        default_channels: Kênh bật sẵn khi người dùng chưa chỉnh tùy chọn.
        kind: `business` (nghiệp vụ) hoặc `technical` (lỗi kỹ thuật, vận hành).
        icon: Emoji đứng đầu tin Telegram/email (trống → theo mức: ℹ️ / ⚠️ / 🚨).
    """

    code: str
    name: str
    description: str
    scope: NotificationScope = "PERSONAL"
    audience: NotificationAudience = "OWNER"
    permission: str | None = None
    default_level: NotificationLevel = "INFO"
    default_channels: tuple[NotificationChannel, ...] = field(default=("IN_APP",))
    kind: NotificationEventKind = "business"
    icon: str = ""

    @property
    def module(self) -> str:
        """Mã module (phần đầu của mã sự kiện)."""
        return self.code.split(".", 1)[0]

    def validate(self) -> None:
        """Kiểm quy ước riêng của sự kiện (quyền tồn tại được kiểm ở registry khi mọi module đã đăng ký).

        Raises:
            ValueError: Khai báo sai quy ước.
        """
        if self.scope == "SYSTEM" and self.audience != "SUBSCRIBERS":
            raise ValueError(f"Sự kiện {self.code!r} phạm vi SYSTEM phải có audience SUBSCRIBERS.")
        if any(channel not in NOTIFICATION_CHANNELS for channel in self.default_channels):
            raise ValueError(f"Sự kiện {self.code!r} có kênh mặc định không hợp lệ.")
        if self.default_level == "ERROR" and "IN_APP" not in self.default_channels:
            raise ValueError(f"Sự kiện {self.code!r} mức ERROR phải bật IN_APP mặc định.")
