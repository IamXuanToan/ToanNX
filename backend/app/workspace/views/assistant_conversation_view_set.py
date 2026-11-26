"""Hội thoại Trợ lý AI (`/api/v1/workspace/assistant/conversations`)."""

from typing import Any

from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.types.permission_rule import DENY, permission_rule
from app.workspace.filters.assistant_conversation_filter import AssistantConversationFilter
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.permissions.assistant_conversation_permission import (
    AssistantConversationPermission as P,
)
from app.workspace.serializers.responses.assistant_conversation_detail_response_serializer import (
    AssistantConversationDetailResponseSerializer,
)
from app.workspace.serializers.responses.assistant_conversation_list_response_serializer import (
    AssistantConversationListResponseSerializer,
)
from app.workspace.services.assistant_conversation_service import AssistantConversationService


class AssistantConversationViewSet(CoreModelViewSet[AssistantConversation]):
    """Danh sách gọn (0 N+1), chi tiết tải tối đa 50 tin gần nhất + `has_more_messages`."""

    service_class = AssistantConversationService
    filterset_class = AssistantConversationFilter
    search_fields = ("title",)
    ordering_fields = ("last_message_at", "created_at")
    ordering = ("-last_message_at", "-created_at", "-pk")
    list_serializer_class = AssistantConversationListResponseSerializer
    detail_serializer_class = AssistantConversationDetailResponseSerializer
    http_method_names = ["get", "post", "delete", "head", "options"]
    bulk_delete_enabled = True
    history_enabled = False
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": DENY,
        "destroy": permission_rule(P.DELETE),
        "bulk_delete": permission_rule(P.DELETE),
    }

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service hội thoại."""
        super().__init__(**kwargs)
        self.conversation_service = AssistantConversationService()

    def retrieve(self, request: Request, *args: Any, **kwargs: Any) -> CoreResponse:
        """Chi tiết hội thoại kèm tối đa 50 tin gần nhất và cờ `has_more_messages`."""
        conversation, items, has_more = self.conversation_service.retrieve_with_recent_messages(
            self.get_actor(request), kwargs["pk"]
        )
        conversation.recent_messages = items  # type: ignore[attr-defined]  # thuộc tính tạm cho detail serializer
        conversation.has_more_messages = has_more  # type: ignore[attr-defined]
        return CoreResponse(self.serialize_detail(conversation))
