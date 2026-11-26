"""Quyền sự cố giám sát Uptime."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class MonitorIncidentPermission(PermissionCatalog):
    """Quyền xem/xóa lịch sử sự cố gián đoạn."""

    READ = PermissionDefinition(
        code="workspace.monitor_incident.read",
        name="Xem sự cố Uptime",
        description="Xem danh sách sự cố gián đoạn của các mục tiêu giám sát.",
    )
    DELETE = PermissionDefinition(
        code="workspace.monitor_incident.delete",
        name="Xóa sự cố Uptime",
        description="Xóa bản ghi sự cố.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="workspace.monitor_incident.manage_all",
        name="Quản lý mọi sự cố Uptime",
        description="Mở phạm vi xem/xóa sang sự cố của mọi người dùng.",
    )

    MEMBER = (READ, DELETE)
