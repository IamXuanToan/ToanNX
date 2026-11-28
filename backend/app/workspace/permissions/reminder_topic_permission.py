"""Quyền trên tài nguyên Chủ đề nhắc việc (`workspace.reminder_topic`)."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class ReminderTopicPermission(PermissionCatalog):
    """Mọi thành viên đều có quyền đọc, tạo, sửa, xóa chủ đề cá nhân của mình."""

    READ = PermissionDefinition(
        "workspace.reminder_topic.read",
        "Xem chủ đề nhắc việc",
        "Xem danh sách chủ đề mặc định và chủ đề cá nhân.",
    )
    CREATE = PermissionDefinition(
        "workspace.reminder_topic.create",
        "Tạo chủ đề nhắc việc",
        "Tạo chủ đề phân loại nhắc việc mới.",
    )
    UPDATE = PermissionDefinition(
        "workspace.reminder_topic.update",
        "Sửa chủ đề nhắc việc",
        "Chỉnh sửa tên, màu hoặc thứ tự chủ đề cá nhân.",
    )
    DELETE = PermissionDefinition(
        "workspace.reminder_topic.delete",
        "Xóa chủ đề nhắc việc",
        "Xóa chủ đề cá nhân.",
    )
    MANAGE_ALL = PermissionDefinition(
        "workspace.reminder_topic.manage_all",
        "Quản lý toàn bộ chủ đề nhắc việc",
        "Xem và quản lý chủ đề nhắc việc của hệ thống và mọi người dùng.",
    )

    MEMBER = (READ, CREATE, UPDATE, DELETE)
