"""Danh mục quyền cho model Tag."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class TagPermission(PermissionCatalog):
    """Quyền quản lý thẻ / hashtag (Tag) theo chuẩn IAM."""

    READ = PermissionDefinition(
        code="novel.tag.read",
        name="Xem thẻ truyện",
        description="Xem danh sách thẻ/hashtag truyện.",
    )
    CREATE = PermissionDefinition(
        code="novel.tag.create",
        name="Tạo thẻ truyện",
        description="Tạo thẻ hashtag mới.",
    )
    UPDATE = PermissionDefinition(
        code="novel.tag.update",
        name="Sửa thẻ truyện",
        description="Cập nhật thẻ truyện.",
    )
    DELETE = PermissionDefinition(
        code="novel.tag.delete",
        name="Xóa thẻ truyện",
        description="Xóa thẻ truyện.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (READ,)
