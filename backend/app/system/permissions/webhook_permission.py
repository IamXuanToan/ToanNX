"""Danh mục quyền cho danh mục webhook."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class WebhookPermission(PermissionCatalog):
    """Quyền xem webhook các module khai báo."""

    READ = PermissionDefinition(
        code="system.webhook.read",
        name="Xem webhook",
        description="Xem danh sách webhook của hệ thống, URL đầy đủ và hướng dẫn cấu hình phía bên thứ ba.",
    )
