"""Quyền thiết bị cá nhân."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class AssetPermission(PermissionCatalog):
    """Quyền quản lý thiết bị & nơi mua/bảo hành."""

    READ = PermissionDefinition(
        code="workspace.asset.read",
        name="Xem thiết bị",
        description="Xem danh sách và chi tiết thiết bị cá nhân.",
    )
    CREATE = PermissionDefinition(
        code="workspace.asset.create",
        name="Thêm thiết bị",
        description="Tạo bản ghi thiết bị mới.",
    )
    UPDATE = PermissionDefinition(
        code="workspace.asset.update",
        name="Sửa thiết bị",
        description="Cập nhật thông tin và hóa đơn thiết bị.",
    )
    DELETE = PermissionDefinition(
        code="workspace.asset.delete",
        name="Xóa thiết bị",
        description="Xóa mềm thiết bị.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="workspace.asset.manage_all",
        name="Quản lý mọi thiết bị",
        description="Mở phạm vi thao tác sang thiết bị của mọi người dùng.",
    )

    MEMBER = (READ, CREATE, UPDATE, DELETE)
