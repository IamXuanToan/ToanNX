"""Danh mục quyền của module System."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class SystemPermission(PermissionCatalog):
    """Quyền System. Mỗi quyền ghi rõ cho phép làm gì."""

    MODULE_READ = PermissionDefinition(
        code="system.module.read",
        name="Xem module",
        description="Xem danh sách module đã cài, phiên bản, phụ thuộc và trạng thái bật/tắt.",
    )
    MODULE_MANAGE = PermissionDefinition(
        code="system.module.manage",
        name="Bật/tắt module",
        description="Bật/tắt module không phải lõi; tắt không xóa dữ liệu.",
    )
