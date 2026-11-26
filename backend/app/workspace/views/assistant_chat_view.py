"""Trò chuyện Trợ lý AI Web Portal (`POST /api/v1/workspace/assistant/chat`)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.workspace.constants.workspace_rate_limit_key import WorkspaceRateLimitKey
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.permissions.assistant_permission import AssistantPermission
from app.workspace.serializers.responses.assistant_chat_response_serializer import (
    AssistantChatResponseSerializer,
)
from app.workspace.serializers.validates.assistant_chat_validate_serializer import (
    AssistantChatValidateSerializer,
)
from app.workspace.services.assistant_service import AssistantService


class AssistantChatView(CoreApiView):
    """Nhận tin nhắn/lệnh Slash, gọi xKiro + 8 tool cá nhân (lọc đúng owner) và trả kết quả."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo AssistantService."""
        super().__init__(**kwargs)
        self.assistant_service = AssistantService()

    @extend_schema(
        request=AssistantChatValidateSerializer,
        responses=AssistantChatResponseSerializer,
    )
    @require_permission(AssistantPermission.CHAT)
    @rate_limit(WorkspaceRateLimitKey.ASSISTANT_CHAT)
    @validate_request(AssistantChatValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Thực thi một lượt chat trên giao diện Web Portal."""
        actor = self.get_actor(request)
        result = self.assistant_service.chat(
            actor,
            validated_data["message"],
            channel=AssistantConversation.Channel.WEB,
            conversation_id=validated_data.get("conversation_id"),
            is_owner=True,
            allow_personal_tools=True,
        )
        return CoreResponse(AssistantChatResponseSerializer(result).data)
