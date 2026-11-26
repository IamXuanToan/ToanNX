"""Quyền trò chuyện với Trợ lý AI."""

from app.core.registry.permission_catalog import PermissionCatalog
from app.core.registry.permission_definition import PermissionDefinition


class AssistantPermission(PermissionCatalog):
    """Quyền gửi câu hỏi cho Trợ lý AI (Web Portal & Slash)."""

    CHAT = PermissionDefinition(
        code="workspace.assistant.chat",
        name="Trò chuyện với Trợ lý AI",
        description="Gửi yêu cầu và câu hỏi cho Trợ lý AI cá nhân.",
    )

    MEMBER = (CHAT,)
