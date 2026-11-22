"""Quyền hóa đơn / chứng từ."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class InvoicePermission(PermissionCatalog):
    """Quyền hóa đơn / chứng từ."""

    READ = PermissionDefinition(
        code="finance.invoice.read",
        name="Xem hóa đơn",
        description="Xem hóa đơn của mình.",
    )
    CREATE = PermissionDefinition(
        code="finance.invoice.create",
        name="Tạo hóa đơn",
        description="Tạo hóa đơn.",
    )
    UPDATE = PermissionDefinition(
        code="finance.invoice.update",
        name="Sửa hóa đơn",
        description="Sửa hóa đơn của mình.",
    )
    DELETE = PermissionDefinition(
        code="finance.invoice.delete",
        name="Xóa hóa đơn",
        description="Xóa hóa đơn của mình.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="finance.invoice.manage_all",
        name="Quản lý mọi hóa đơn",
        description="Xem và thao tác hóa đơn của mọi người khi có quyền action tương ứng.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (READ, CREATE, UPDATE, DELETE)
