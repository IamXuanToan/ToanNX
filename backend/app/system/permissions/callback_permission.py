"""Danh mục quyền cho danh mục callback."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class CallbackPermission(PermissionCatalog):
    """Quyền xem URL callback các module khai báo."""

    READ = PermissionDefinition(
        code="system.callback.read",
        name="Xem callback",
        description="Xem URL callback (OAuth...) đầy đủ để khai ở Google, GitHub và bên thứ ba khác.",
    )
