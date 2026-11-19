"""Danh mục quyền cho model Novel."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class NovelPermission(PermissionCatalog):
    """Quyền quản lý truyện (Novel) theo chuẩn IAM."""

    READ = PermissionDefinition(
        code="novel.novel.read",
        name="Xem truyện",
        description="Xem danh sách và chi tiết truyện.",
    )
    CREATE = PermissionDefinition(
        code="novel.novel.create",
        name="Tạo truyện",
        description="Tạo truyện mới.",
    )
    UPDATE = PermissionDefinition(
        code="novel.novel.update",
        name="Sửa truyện",
        description="Cập nhật thông tin truyện.",
    )
    DELETE = PermissionDefinition(
        code="novel.novel.delete",
        name="Xóa truyện",
        description="Xóa mềm truyện.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="novel.novel.manage_all",
        name="Quản lý mọi truyện",
        description="Đọc và thao tác truyện của mọi người dùng khi có quyền action tương ứng.",
    )
    IMPORT = PermissionDefinition(
        code="novel.novel.import",
        name="Import truyện",
        description="Import truyện và danh sách chương từ file template mẫu.",
    )
