"""Danh mục quyền cho tài nguyên Đường dẫn trang (PagePath)."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class PagePathPermission(PermissionCatalog):
    """Quyền đường dẫn giữa theo chuẩn IAM."""

    PATH_READ = PermissionDefinition(
        code="utilities.page_path.read", name="Xem đường dẫn giữa", description="Xem danh mục đường dẫn giữa."
    )
    PATH_CREATE = PermissionDefinition(
        code="utilities.page_path.create",
        name="Tạo đường dẫn giữa",
        description="Tạo đường dẫn giữa mới (ví dụ `qr`) để mọi người đặt trang vào.",
    )
    PATH_UPDATE = PermissionDefinition(
        code="utilities.page_path.update",
        name="Sửa đường dẫn giữa",
        description="Đổi tên, mô tả, thứ tự, bật/tắt; đổi segment làm URL cũ 404.",
    )
    PATH_DELETE = PermissionDefinition(
        code="utilities.page_path.delete",
        name="Xóa đường dẫn giữa",
        description="Xóa đường dẫn giữa không còn trang nào.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (PATH_READ,)
