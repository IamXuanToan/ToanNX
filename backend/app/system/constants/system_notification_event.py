"""Mã sự kiện thông báo của module System."""

from enum import StrEnum


class SystemNotificationEvent(StrEnum):
    """Sự kiện System phát qua `NotificationService.notify`."""

    AUTH_LOGIN = "system.auth.login"
    AUTH_NEW_DEVICE = "system.auth.new_device"
    AUTH_PASSWORD_CHANGED = "system.auth.password_changed"  # noqa: S105 - mã/nhãn, không phải bí mật
    ANNOUNCEMENT_PUBLISHED = "system.announcement.published"
    DELIVERY_FAILED = "system.notification.delivery_failed"
    STORAGE_QUOTA_WARNING = "system.storage.quota_warning"
