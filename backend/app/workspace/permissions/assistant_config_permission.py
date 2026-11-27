"""Quyền cấu hình Chatbot AI dùng chung toàn hệ thống (chỉ dành cho Admin)."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class AssistantConfigPermission(PermissionCatalog):
    """Chỉ Admin / quản trị viên được phép đọc và cập nhật Avatar, Policy, Model của Chatbot AI."""

    READ = PermissionDefinition(
        code="workspace.assistant_config.read",
        name="Xem cấu hình Chatbot AI",
        description="Xem Avatar, tên hiển thị, Policy, Model AI và cấu hình Telegram của Chatbot.",
    )
    UPDATE = PermissionDefinition(
        code="workspace.assistant_config.update",
        name="Cập nhật cấu hình Chatbot AI",
        description="Chỉnh sửa Avatar, tên hiển thị, Policy, Model AI và cấu hình Telegram của Chatbot.",
    )

    MEMBER = ()
