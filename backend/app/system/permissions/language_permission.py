"""Quyền hạn đối với tài nguyên Ngôn ngữ (`Language`)."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class LanguagePermission(PermissionCatalog):
    """Phân quyền cho danh mục ngôn ngữ dùng chung toàn hệ thống."""

    READ = PermissionDefinition(
        code="system.language.read",
        name="Xem ngôn ngữ",
        description="Xem danh sách và chi tiết ngôn ngữ.",
    )
    CREATE = PermissionDefinition(
        code="system.language.create",
        name="Thêm ngôn ngữ",
        description="Thêm ngôn ngữ mới vào hệ thống.",
    )
    UPDATE = PermissionDefinition(
        code="system.language.update",
        name="Cập nhật ngôn ngữ",
        description="Chỉnh sửa tên, cờ hoặc bật/tắt ngôn ngữ.",
    )
    DELETE = PermissionDefinition(
        code="system.language.delete",
        name="Xóa ngôn ngữ",
        description="Xóa ngôn ngữ không mặc định khỏi hệ thống.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="system.language.manage_all",
        name="Quản lý toàn bộ ngôn ngữ",
        description="Toàn quyền quản trị danh mục ngôn ngữ.",
    )

    MEMBER = (READ,)
