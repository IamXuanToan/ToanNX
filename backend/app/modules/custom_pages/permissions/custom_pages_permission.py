"""Danh mục quyền trang tùy chỉnh."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class CustomPagesPermission(PermissionCatalog):
    """Quyền trang và block theo chuẩn IAM."""

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
    PATH_READ = PermissionDefinition(
        code="custom_pages.path.read", name="Xem đường dẫn giữa", description="Xem danh mục đường dẫn giữa."
    )
    PATH_CREATE = PermissionDefinition(
        code="custom_pages.path.create",
        name="Tạo đường dẫn giữa",
        description="Tạo đường dẫn giữa mới (ví dụ `qr`) để mọi người đặt trang vào.",
    )
    PATH_UPDATE = PermissionDefinition(
        code="custom_pages.path.update",
        name="Sửa đường dẫn giữa",
        description="Đổi tên, mô tả, thứ tự, bật/tắt; đổi segment làm URL cũ 404.",
    )
    PATH_DELETE = PermissionDefinition(
        code="custom_pages.path.delete",
        name="Xóa đường dẫn giữa",
        description="Xóa đường dẫn giữa không còn trang nào.",
    )
