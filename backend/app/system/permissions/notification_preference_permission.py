"""Quyền tùy chọn nhận thông báo."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class NotificationPreferencePermission(PermissionCatalog):
    """Quyền tùy chọn nhận thông báo."""

    READ = PermissionDefinition(
        code="system.notification_preference.read",
        name="Xem tùy chọn thông báo",
        description="Xem sự kiện và kênh nhận thông báo của mình.",
    )
    UPDATE = PermissionDefinition(
        code="system.notification_preference.update",
        name="Sửa tùy chọn thông báo",
        description="Bật/tắt sự kiện theo kênh.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (READ, UPDATE)
