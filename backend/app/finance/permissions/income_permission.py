"""Quyền giao dịch thu nhập."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class IncomePermission(PermissionCatalog):
    """Quyền giao dịch thu nhập."""

    READ = PermissionDefinition(
        code="finance.income.read",
        name="Xem thu nhập",
        description="Xem thu nhập của mình.",
    )
    CREATE = PermissionDefinition(
        code="finance.income.create",
        name="Tạo thu nhập",
        description="Tạo thu nhập.",
    )
    UPDATE = PermissionDefinition(
        code="finance.income.update",
        name="Sửa thu nhập",
        description="Sửa thu nhập của mình.",
    )
    DELETE = PermissionDefinition(
        code="finance.income.delete",
        name="Xóa thu nhập",
        description="Xóa thu nhập của mình.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="finance.income.manage_all",
        name="Quản lý mọi thu nhập",
        description="Xem và thao tác thu nhập của mọi người khi có quyền action tương ứng.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (READ, CREATE, UPDATE, DELETE)
