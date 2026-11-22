"""Quyền gửi thông báo hệ thống."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class AnnouncementPermission(PermissionCatalog):
    """Quyền gửi thông báo hệ thống."""

    READ = PermissionDefinition(
        code="system.announcement.read",
        name="Xem thông báo hệ thống đã gửi",
        description="Xem danh sách thông báo hệ thống.",
    )
    CREATE = PermissionDefinition(
        code="system.announcement.create",
        name="Gửi thông báo hệ thống",
        description="Gửi thông báo tới mọi người hoặc theo vai trò.",
    )
    DELETE = PermissionDefinition(
        code="system.announcement.delete",
        name="Thu hồi thông báo hệ thống",
        description="Thu hồi thông báo đã gửi.",
    )
