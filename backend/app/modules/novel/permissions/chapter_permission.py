"""Danh mục quyền cho model Chapter."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class ChapterPermission(PermissionCatalog):
    """Quyền quản lý chương truyện (Chapter) theo chuẩn IAM."""

    READ = PermissionDefinition(
        code="novel.chapter.read",
        name="Xem chương",
        description="Xem danh sách và nội dung chương truyện.",
    )
    CREATE = PermissionDefinition(
        code="novel.chapter.create",
        name="Tạo chương",
        description="Tạo chương truyện mới.",
    )
    UPDATE = PermissionDefinition(
        code="novel.chapter.update",
        name="Sửa chương",
        description="Cập nhật tiêu đề, số chương, nội dung chương.",
    )
    DELETE = PermissionDefinition(
        code="novel.chapter.delete",
        name="Xóa chương",
        description="Xóa mềm chương truyện.",
    )
