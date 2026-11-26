"""Tiện ích chuẩn hóa & ánh xạ kênh thông báo từng bản ghi sang `system.NotificationChannel`."""

from collections.abc import Sequence

from app.system.constants.notification_channel import NotificationChannel
from app.workspace.constants.workspace_defaults import DEFAULT_WORKSPACE_NOTIFICATION_CHANNELS
from app.workspace.constants.workspace_notification_channel import WorkspaceNotificationChannel


def normalize_workspace_channels(raw: Sequence[str] | None) -> list[str]:
    """Chuẩn hóa, khử trùng lặp và giữ thứ tự chuẩn; rỗng thì dùng `["WEBSITE"]`."""
    if not raw:
        return list(DEFAULT_WORKSPACE_NOTIFICATION_CHANNELS)
    valid = {c.value for c in WorkspaceNotificationChannel}
    ordered = (
        WorkspaceNotificationChannel.WEBSITE.value,
        WorkspaceNotificationChannel.TELEGRAM.value,
        WorkspaceNotificationChannel.EMAIL.value,
    )
    selected = {str(item).strip().upper() for item in raw if str(item or "").strip()}
    result = [item for item in ordered if item in selected and item in valid]
    return result or list(DEFAULT_WORKSPACE_NOTIFICATION_CHANNELS)


def to_delivery_channels(raw: Sequence[str] | None) -> tuple[str, ...]:
    """Ánh xạ kênh cấu hình trên bản ghi sang tập `NotificationChannel` của outbox `system`."""
    normalized = normalize_workspace_channels(raw)
    channels: list[str] = []
    if WorkspaceNotificationChannel.WEBSITE.value in normalized:
        channels.extend((NotificationChannel.IN_APP.value, NotificationChannel.PUSH.value))
    if WorkspaceNotificationChannel.TELEGRAM.value in normalized:
        channels.append(NotificationChannel.TELEGRAM.value)
    if WorkspaceNotificationChannel.EMAIL.value in normalized:
        channels.append(NotificationChannel.EMAIL.value)
    return tuple(channels)
