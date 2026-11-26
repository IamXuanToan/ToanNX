"""Quyền Cài đặt Trợ lý & Lịch Digest cá nhân."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class WorkspaceSettingPermission(PermissionCatalog):
    """Quyền xem và chỉnh sửa cấu hình Trợ lý/Digest/Telegram."""

    READ = PermissionDefinition(
        code="workspace.workspace_setting.read",
        name="Xem cài đặt trợ lý",
        description="Xem cấu hình múi giờ, digest, model AI và hiển thị Telegram.",
    )
    UPDATE = PermissionDefinition(
        code="workspace.workspace_setting.update",
        name="Cập nhật cài đặt trợ lý",
        description="Lưu thay đổi cài đặt trợ lý cá nhân.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="workspace.workspace_setting.manage_all",
        name="Quản lý mọi cài đặt trợ lý",
        description="Xem và chỉnh sửa cấu hình của người dùng khác.",
    )

    MEMBER = (READ, UPDATE)
