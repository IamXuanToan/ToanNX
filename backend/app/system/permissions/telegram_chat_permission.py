"""Quyền nơi nhận Telegram."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class TelegramChatPermission(PermissionCatalog):
    """Quyền nơi nhận Telegram."""

    READ = PermissionDefinition(
        code="system.telegram_chat.read",
        name="Xem nơi nhận Telegram",
        description="Xem nhóm/chat Telegram đã đăng ký.",
    )
    CREATE = PermissionDefinition(
        code="system.telegram_chat.create",
        name="Đăng ký nơi nhận Telegram",
        description="Tạo mã đăng ký, xác minh chat.",
    )
    UPDATE = PermissionDefinition(
        code="system.telegram_chat.update",
        name="Sửa nơi nhận Telegram",
        description="Bật/tắt, gửi tin thử.",
    )
    DELETE = PermissionDefinition(
        code="system.telegram_chat.delete",
        name="Xóa nơi nhận Telegram",
        description="Xóa nơi nhận.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="system.telegram_chat.manage_all",
        name="Quản lý mọi nơi nhận Telegram",
        description="Xem và thao tác nơi nhận của mọi người khi có quyền action tương ứng.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (READ, CREATE, UPDATE, DELETE)
