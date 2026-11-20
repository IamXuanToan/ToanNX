"""Danh mục quyền cho tài nguyên Liên kết rút gọn (ShortLink)."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class ShortLinkPermission(PermissionCatalog):
    """Quyền liên kết rút gọn theo chuẩn IAM."""

    READ = PermissionDefinition(
        code="utilities.short_link.read", name="Xem link", description="Xem link của mình."
    )
    CREATE = PermissionDefinition(
        code="utilities.short_link.create", name="Tạo link", description="Tạo link rút gọn của mình."
    )
    UPDATE = PermissionDefinition(
        code="utilities.short_link.update", name="Sửa link", description="Sửa link của mình."
    )
    DELETE = PermissionDefinition(
        code="utilities.short_link.delete", name="Xóa link", description="Xóa mềm link của mình."
    )
    MANAGE_ALL = PermissionDefinition(
        code="utilities.short_link.manage_all",
        name="Quản lý mọi link",
        description="Đọc và thao tác link của mọi người dùng khi có quyền action tương ứng.",
    )
