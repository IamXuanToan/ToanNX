"""Quyền bot Telegram riêng."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class TelegramBotPermission(PermissionCatalog):
    """Quyền bot Telegram riêng."""

    READ = PermissionDefinition(
        code="system.telegram_bot.read",
        name="Xem bot Telegram",
        description="Xem bot Telegram của mình.",
    )
    CREATE = PermissionDefinition(
        code="system.telegram_bot.create",
        name="Thêm bot Telegram",
        description="Lưu token bot Telegram của mình.",
    )
    UPDATE = PermissionDefinition(
        code="system.telegram_bot.update",
        name="Sửa bot Telegram",
        description="Đổi token, kiểm tra bot.",
    )
    DELETE = PermissionDefinition(
        code="system.telegram_bot.delete",
        name="Xóa bot Telegram",
        description="Xóa bot và các nơi nhận của bot.",
    )

    # Quyền của vai trò thành viên: thao tác bản ghi do mình tạo.
    MEMBER = (READ, CREATE, UPDATE, DELETE)
