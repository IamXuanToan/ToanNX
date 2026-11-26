"""Quyền xem Lịch hoạt động Workspace trên Portal."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class WorkspaceCalendarPermission(PermissionCatalog):
    """Quyền xem lịch tổng hợp hạn bảo hành, gia hạn, nhắc việc và sự cố."""

    READ = PermissionDefinition(
        code="workspace.calendar.read",
        name="Xem lịch hoạt động",
        description="Xem sự kiện theo tháng/ngày trên PortalCalendar.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="workspace.calendar.manage_all",
        name="Xem lịch mọi người dùng",
        description="Xem lịch hoạt động theo `?owner=` của người dùng khác.",
    )

    MEMBER = (READ,)
