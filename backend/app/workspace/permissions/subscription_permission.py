"""Quyền gói dịch vụ định kỳ."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class SubscriptionPermission(PermissionCatalog):
    """Quyền quản lý dịch vụ định kỳ và gia hạn."""

    READ = PermissionDefinition(
        code="workspace.subscription.read",
        name="Xem dịch vụ định kỳ",
        description="Xem danh sách và chi tiết gói đăng ký.",
    )
    CREATE = PermissionDefinition(
        code="workspace.subscription.create",
        name="Thêm dịch vụ định kỳ",
        description="Tạo dịch vụ định kỳ mới.",
    )
    UPDATE = PermissionDefinition(
        code="workspace.subscription.update",
        name="Sửa và gia hạn dịch vụ",
        description="Cập nhật thông tin hoặc xác nhận gia hạn chu kỳ.",
    )
    DELETE = PermissionDefinition(
        code="workspace.subscription.delete",
        name="Xóa dịch vụ định kỳ",
        description="Xóa mềm dịch vụ định kỳ.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="workspace.subscription.manage_all",
        name="Quản lý mọi dịch vụ định kỳ",
        description="Mở phạm vi thao tác sang dịch vụ của mọi người dùng.",
    )

    MEMBER = (READ, CREATE, UPDATE, DELETE)
