"""Danh mục quyền phần IAM (module System)."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class IamPermission(PermissionCatalog):
    """Quyền IAM. Mỗi quyền ghi rõ cho phép làm gì."""

    ROLE_READ = PermissionDefinition(
        code="system.role.read",
        name="Xem vai trò",
        description="Xem danh sách vai trò và quyền của từng vai trò.",
    )
    ROLE_CREATE = PermissionDefinition(
        code="system.role.create",
        name="Tạo vai trò",
        description="Tạo vai trò mới (không phải vai trò hệ thống).",
    )
    ROLE_UPDATE = PermissionDefinition(
        code="system.role.update",
        name="Cập nhật vai trò",
        description="Sửa tên, mô tả, bật/tắt vai trò. Vai trò hệ thống chỉ superuser được sửa.",
    )
    ROLE_DELETE = PermissionDefinition(
        code="system.role.delete",
        name="Xóa vai trò",
        description="Xóa (mềm) vai trò tự tạo; vai trò hệ thống không xóa được.",
    )
    ROLE_ASSIGN = PermissionDefinition(
        code="system.role.assign",
        name="Gán vai trò cho người dùng",
        description="Gán/thu hồi vai trò của người dùng khác; chỉ gán được vai trò có quyền mình đang có.",
    )
    PERMISSION_READ = PermissionDefinition(
        code="system.permission.read",
        name="Xem quyền",
        description="Xem danh mục quyền do các module khai báo.",
    )
    PERMISSION_ASSIGN = PermissionDefinition(
        code="system.permission.assign",
        name="Gán quyền cho vai trò",
        description="Thêm/bớt quyền của vai trò; chỉ cấp được quyền mình đang có.",
    )
