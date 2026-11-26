"""Phân trang tin nhắn cũ của một hội thoại (`GET /workspace/assistant/conversations/<pk>/messages`)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from app.core.pagination.core_page_number_pagination import CorePageNumberPagination
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.workspace.permissions.assistant_conversation_permission import (
    AssistantConversationPermission,
)
from app.workspace.serializers.responses.assistant_message_response_serializer import (
    AssistantMessageResponseSerializer,
)
from app.workspace.services.assistant_conversation_service import AssistantConversationService


class AssistantConversationMessagesView(CoreApiView):
    """Tải thêm lịch sử tin nhắn cũ theo phân trang chuẩn để không phình endpoint retrieve."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service hội thoại."""
        super().__init__(**kwargs)
        self.conversation_service = AssistantConversationService()

    @extend_schema(responses=AssistantMessageResponseSerializer(many=True))
    @require_permission(AssistantConversationPermission.READ)
    def get(self, request: Request, pk: Any) -> Response:
        """Trả danh sách tin nhắn (hỗ trợ `?page=&page_size=`)."""
        queryset = self.conversation_service.messages_queryset_for(self.get_actor(request), pk)
        paginator = CorePageNumberPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is None:
            return CoreResponse(AssistantMessageResponseSerializer(queryset, many=True).data)
        return paginator.get_paginated_response(AssistantMessageResponseSerializer(page, many=True).data)
