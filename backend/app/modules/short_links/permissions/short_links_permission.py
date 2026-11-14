"""Danh mục quyền liên kết rút gọn."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class ShortLinksPermission(PermissionCatalog):
    """Quyền liên kết rút gọn theo chuẩn IAM."""

    READ = PermissionDefinition(
        code="short_links.link.read", name="Xem link", description="Xem link của mình."
    )
    CREATE = PermissionDefinition(
        code="short_links.link.create", name="Tạo link", description="Tạo link rút gọn của mình."
    )
    UPDATE = PermissionDefinition(
        code="short_links.link.update", name="Sửa link", description="Sửa link của mình."
    )
    DELETE = PermissionDefinition(
        code="short_links.link.delete", name="Xóa link", description="Xóa mềm link của mình."
    )
    MANAGE_ALL = PermissionDefinition(
        code="short_links.link.manage_all",
        name="Quản lý mọi link",
        description="Đọc và thao tác link của mọi người dùng khi có quyền action tương ứng.",
    )
