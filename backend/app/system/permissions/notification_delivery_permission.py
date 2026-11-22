"""Quyền nhật ký gửi thông báo."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class NotificationDeliveryPermission(PermissionCatalog):
    """Quyền nhật ký gửi thông báo."""

    READ = PermissionDefinition(
        code="system.notification_delivery.read",
        name="Xem nhật ký thông báo",
        description="Xem các lần gửi thông báo của mình.",
    )
    UPDATE = PermissionDefinition(
        code="system.notification_delivery.update",
        name="Gửi lại thông báo",
        description="Gửi lại lần gửi lỗi.",
    )
    DELETE = PermissionDefinition(
        code="system.notification_delivery.delete",
        name="Xóa nhật ký gửi thông báo",
        description="Xóa mềm lần gửi (từng dòng hoặc hàng loạt) trong phạm vi được xem.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="system.notification_delivery.manage_all",
        name="Quản lý mọi lần gửi",
        description="Xem nhật ký gửi của mọi người; nhận cảnh báo gửi lỗi.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (READ,)
