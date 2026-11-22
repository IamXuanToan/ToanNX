"""Quyền chuông thông báo của chính mình."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class NotificationPermission(PermissionCatalog):
    """Quyền chuông thông báo của chính mình."""

    READ = PermissionDefinition(
        code="system.notification.read",
        name="Xem thông báo",
        description="Xem chuông thông báo của mình, đánh dấu đã đọc.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (READ,)
