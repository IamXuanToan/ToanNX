"""Quyền quy tắc nhận diện."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class RulePermission(PermissionCatalog):
    """Quyền quy tắc nhận diện."""

    READ = PermissionDefinition(
        code="finance.rule.read",
        name="Xem quy tắc",
        description="Xem quy tắc của mình.",
    )
    CREATE = PermissionDefinition(
        code="finance.rule.create",
        name="Tạo quy tắc",
        description="Tạo quy tắc.",
    )
    UPDATE = PermissionDefinition(
        code="finance.rule.update",
        name="Sửa quy tắc",
        description="Sửa quy tắc của mình.",
    )
    DELETE = PermissionDefinition(
        code="finance.rule.delete",
        name="Xóa quy tắc",
        description="Xóa quy tắc của mình.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="finance.rule.manage_all",
        name="Quản lý mọi quy tắc",
        description="Xem và thao tác quy tắc của mọi người khi có quyền action tương ứng.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (READ, CREATE, UPDATE, DELETE)
