"""Kênh nhận thông báo trên từng bản ghi Nhắc việc / Dịch vụ / Thiết bị."""

from enum import StrEnum


class WorkspaceNotificationChannel(StrEnum):
    """Mặc định `WEBSITE` (Chuông web + Web Push); tùy chọn `TELEGRAM` và `EMAIL`."""

    WEBSITE = "WEBSITE"
    TELEGRAM = "TELEGRAM"
    EMAIL = "EMAIL"
