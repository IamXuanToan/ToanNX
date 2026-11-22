"""Danh mục quyền cho model Genre."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class GenrePermission(PermissionCatalog):
    """Quyền quản lý thể loại truyện (Genre) theo chuẩn IAM."""

    READ = PermissionDefinition(
        code="novel.genre.read",
        name="Xem thể loại",
        description="Xem danh sách thể loại truyện.",
    )
    CREATE = PermissionDefinition(
        code="novel.genre.create",
        name="Tạo thể loại",
        description="Thêm thể loại truyện mới.",
    )
    UPDATE = PermissionDefinition(
        code="novel.genre.update",
        name="Sửa thể loại",
        description="Cập nhật thông tin thể loại.",
    )
    DELETE = PermissionDefinition(
        code="novel.genre.delete",
        name="Xóa thể loại",
        description="Xóa thể loại.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (READ,)
