"""Quyền tỷ giá."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class ExchangeRatePermission(PermissionCatalog):
    """Quyền tỷ giá."""

    READ = PermissionDefinition(
        code="system.exchange_rate.read",
        name="Xem tỷ giá",
        description="Xem và tra cứu tỷ giá theo ngày.",
    )
    CREATE = PermissionDefinition(
        code="system.exchange_rate.create",
        name="Thêm tỷ giá",
        description="Nhập tay tỷ giá, lấy lại từ API.",
    )
    UPDATE = PermissionDefinition(
        code="system.exchange_rate.update",
        name="Sửa tỷ giá",
        description="Sửa tỷ giá nhập tay.",
    )
    DELETE = PermissionDefinition(
        code="system.exchange_rate.delete",
        name="Xóa tỷ giá",
        description="Xóa tỷ giá nhập tay.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (READ,)
