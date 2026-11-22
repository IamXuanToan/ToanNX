"""Quyền tiền tệ."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class CurrencyPermission(PermissionCatalog):
    """Quyền tiền tệ."""

    READ = PermissionDefinition(
        code="system.currency.read",
        name="Xem tiền tệ",
        description="Xem danh mục tiền tệ.",
    )
    CREATE = PermissionDefinition(
        code="system.currency.create",
        name="Thêm tiền tệ",
        description="Thêm tiền tệ.",
    )
    UPDATE = PermissionDefinition(
        code="system.currency.update",
        name="Sửa tiền tệ",
        description="Sửa, bật/tắt tiền tệ.",
    )
    DELETE = PermissionDefinition(
        code="system.currency.delete",
        name="Xóa tiền tệ",
        description="Xóa tiền tệ chưa được dùng.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (READ,)
