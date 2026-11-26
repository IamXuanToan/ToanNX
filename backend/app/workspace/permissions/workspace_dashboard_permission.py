"""Quyền xem Dashboard tổng quan Workspace trên Portal."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class WorkspaceDashboardPermission(PermissionCatalog):
    """Quyền xem các thẻ KPI tổng hợp cá nhân."""

    READ = PermissionDefinition(
        code="workspace.dashboard.read",
        name="Xem tổng quan trợ lý",
        description="Xem các thẻ thống kê thiết bị, nhắc việc, monitor và chi tiêu.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="workspace.dashboard.manage_all",
        name="Xem tổng quan mọi người dùng",
        description="Xem thống kê tổng quan theo `?owner=` của người dùng khác.",
    )

    MEMBER = (READ,)
