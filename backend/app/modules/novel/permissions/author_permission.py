"""Danh mục quyền cho model Author."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class AuthorPermission(PermissionCatalog):
    """Quyền quản lý tác giả truyện (Author) theo chuẩn IAM."""

    READ = PermissionDefinition(
        code="novel.author.read",
        name="Xem tác giả",
        description="Xem danh sách và chi tiết tác giả truyện.",
    )
    CREATE = PermissionDefinition(
        code="novel.author.create",
        name="Tạo tác giả",
        description="Thêm tác giả mới.",
    )
    UPDATE = PermissionDefinition(
        code="novel.author.update",
        name="Sửa tác giả",
        description="Cập nhật thông tin tác giả, tiểu sử.",
    )
    DELETE = PermissionDefinition(
        code="novel.author.delete",
        name="Xóa tác giả",
        description="Xóa tác giả.",
    )
