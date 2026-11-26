"""Quyền Nhắc việc cá nhân."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class ReminderPermission(PermissionCatalog):
    """Quyền quản lý công việc và nhắc hẹn."""

    READ = PermissionDefinition(
        code="workspace.reminder.read",
        name="Xem nhắc việc",
        description="Xem danh sách và chi tiết nhắc việc.",
    )
    CREATE = PermissionDefinition(
        code="workspace.reminder.create",
        name="Tạo nhắc việc",
        description="Thêm công việc hoặc lịch nhắc mới.",
    )
    UPDATE = PermissionDefinition(
        code="workspace.reminder.update",
        name="Sửa và hoàn thành nhắc việc",
        description="Cập nhật hoặc đánh dấu hoàn thành nhắc việc.",
    )
    DELETE = PermissionDefinition(
        code="workspace.reminder.delete",
        name="Xóa nhắc việc",
        description="Xóa mềm nhắc việc.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="workspace.reminder.manage_all",
        name="Quản lý mọi nhắc việc",
        description="Mở phạm vi thao tác sang nhắc việc của mọi người dùng.",
    )

    MEMBER = (READ, CREATE, UPDATE, DELETE)
