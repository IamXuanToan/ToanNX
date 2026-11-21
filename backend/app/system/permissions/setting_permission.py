"""Danh mục quyền của tài nguyên cấu hình hệ thống (Setting)."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class SettingPermission(PermissionCatalog):
    """Quyền quản lý cấu hình hệ thống."""

    SETTING_READ = PermissionDefinition(
        code="system.setting.read",
        name="Xem cấu hình",
        description="Xem danh sách và chi tiết các tham số cấu hình hệ thống.",
    )
    SETTING_CREATE = PermissionDefinition(
        code="system.setting.create",
        name="Tạo cấu hình",
        description="Tạo khóa cấu hình mới trong hệ thống.",
    )
    SETTING_UPDATE = PermissionDefinition(
        code="system.setting.update",
        name="Cập nhật cấu hình",
        description="Thay đổi giá trị các tham số cấu hình hệ thống.",
    )
    SETTING_DELETE = PermissionDefinition(
        code="system.setting.delete",
        name="Xóa cấu hình",
        description="Xóa khóa cấu hình khỏi hệ thống.",
    )
