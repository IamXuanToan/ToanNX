"""Quyền mục tiêu giám sát Uptime/HTTP."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class MonitorTargetPermission(PermissionCatalog):
    """Quyền cấu hình và ping thử mục tiêu giám sát."""

    READ = PermissionDefinition(
        code="workspace.monitor_target.read",
        name="Xem giám sát Uptime",
        description="Xem danh sách và trạng thái endpoint giám sát.",
    )
    CREATE = PermissionDefinition(
        code="workspace.monitor_target.create",
        name="Thêm giám sát Uptime",
        description="Tạo mục tiêu giám sát URL mới.",
    )
    UPDATE = PermissionDefinition(
        code="workspace.monitor_target.update",
        name="Sửa và ping thử giám sát",
        description="Cập nhật cấu hình hoặc bấm kiểm tra trực tiếp.",
    )
    DELETE = PermissionDefinition(
        code="workspace.monitor_target.delete",
        name="Xóa giám sát Uptime",
        description="Xóa mềm mục tiêu giám sát.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="workspace.monitor_target.manage_all",
        name="Quản lý mọi giám sát Uptime",
        description="Mở phạm vi thao tác sang monitor của mọi người dùng.",
    )

    MEMBER = (READ, CREATE, UPDATE, DELETE)
