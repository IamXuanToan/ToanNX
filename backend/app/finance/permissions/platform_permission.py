"""Quyền nền tảng và lịch sử khấu trừ."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class PlatformPermission(PermissionCatalog):
    """Quyền nền tảng và lịch sử khấu trừ."""

    READ = PermissionDefinition(
        code="finance.platform.read",
        name="Xem nền tảng",
        description="Xem nền tảng của mình.",
    )
    CREATE = PermissionDefinition(
        code="finance.platform.create",
        name="Tạo nền tảng",
        description="Tạo nền tảng.",
    )
    UPDATE = PermissionDefinition(
        code="finance.platform.update",
        name="Sửa nền tảng",
        description="Sửa nền tảng của mình.",
    )
    DELETE = PermissionDefinition(
        code="finance.platform.delete",
        name="Xóa nền tảng",
        description="Xóa nền tảng của mình.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="finance.platform.manage_all",
        name="Quản lý mọi nền tảng",
        description="Xem và thao tác nền tảng của mọi người khi có quyền action tương ứng.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (READ, CREATE, UPDATE, DELETE)
