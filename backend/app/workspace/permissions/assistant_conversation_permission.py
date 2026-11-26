"""Quyền Hội thoại Trợ lý AI."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class AssistantConversationPermission(PermissionCatalog):
    """Quyền xem và xóa lịch sử hội thoại trợ lý AI."""

    READ = PermissionDefinition(
        code="workspace.assistant_conversation.read",
        name="Xem lịch sử hội thoại AI",
        description="Xem danh sách phiên chat và các tin nhắn với trợ lý.",
    )
    DELETE = PermissionDefinition(
        code="workspace.assistant_conversation.delete",
        name="Xóa lịch sử hội thoại AI",
        description="Xóa mềm phiên hội thoại với trợ lý AI.",
    )
    MANAGE_ALL = PermissionDefinition(
        code="workspace.assistant_conversation.manage_all",
        name="Quản lý mọi hội thoại AI",
        description="Mở phạm vi xem/xóa sang hội thoại của mọi người dùng.",
    )

    MEMBER = (READ, DELETE)
