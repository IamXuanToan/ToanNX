"""Quyền phiếu bảo hành và sửa chữa thiết bị."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class AssetWarrantyClaimPermission(PermissionCatalog):
    """Quyền quản lý phiếu bảo hành/sửa chữa."""

    READ = PermissionDefinition(
        code="workspace.warranty_claim.read",
        name="Xem phiếu bảo hành",
        description="Xem danh sách và chi tiết phiếu bảo hành/sửa chữa.",
    )
    CREATE = PermissionDefinition(
        code="workspace.warranty_claim.create",
        name="Tạo phiếu bảo hành",
        description="Lập phiếu bảo hành hoặc sửa chữa mới cho thiết bị.",
    )
    UPDATE = PermissionDefinition(
        code="workspace.warranty_claim.update",
        name="Cập nhật phiếu bảo hành",
        description="Cập nhật tiến độ và chi phí sửa chữa.",
    )
    DELETE = PermissionDefinition(
        code="workspace.warranty_claim.delete",
        name="Xóa phiếu bảo hành",
        description="Xóa mềm phiếu bảo hành.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="workspace.warranty_claim.manage_all",
        name="Quản lý mọi phiếu bảo hành",
        description="Mở phạm vi thao tác sang phiếu của mọi người dùng.",
    )

    MEMBER = (READ, CREATE, UPDATE, DELETE)
