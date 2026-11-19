"""Danh mục quyền cho tài nguyên Trang tùy chỉnh (Page)."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class PagePermission(PermissionCatalog):
    """Quyền trang theo chuẩn IAM."""

    READ = PermissionDefinition(
        code="custom_pages.page.read", name="Xem trang", description="Xem trang của mình."
    )
    CREATE = PermissionDefinition(
        code="custom_pages.page.create", name="Tạo trang", description="Tạo trang cho tài khoản của mình."
    )
    UPDATE = PermissionDefinition(
        code="custom_pages.page.update",
        name="Sửa trang",
        description="Sửa trang của mình (nội dung, giao diện, SEO, trạng thái).",
    )
    DELETE = PermissionDefinition(
        code="custom_pages.page.delete", name="Xóa trang", description="Xóa mềm trang của mình."
    )
    MANAGE_ALL = PermissionDefinition(
        code="custom_pages.page.manage_all",
        name="Quản lý mọi trang",
        description="Đọc và thao tác trang của mọi người dùng khi có quyền action tương ứng.",
    )
