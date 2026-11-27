"""Luồng chat Web duy nhất của Trợ lý AI (`GET/DELETE /workspace/assistant/thread`)."""

from typing import Any

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.request import Request

from app.core.constants.core_rate_limit_key import CoreRateLimitKey
from app.core.decorators.rate_limit import rate_limit
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.workspace.permissions.assistant_permission import AssistantPermission
from app.workspace.serializers.responses.assistant_thread_clear_response_serializer import (
    AssistantThreadClearResponseSerializer,
)
from app.workspace.serializers.responses.assistant_thread_response_serializer import (
    AssistantThreadResponseSerializer,
)
from app.workspace.serializers.validates.assistant_thread_query_validate_serializer import (
    AssistantThreadQueryValidateSerializer,
)
from app.workspace.services.assistant_conversation_service import AssistantConversationService


class AssistantThreadView(CoreApiView):
    """Đọc tin nhắn và làm mới 1 luồng chat Web duy nhất của người đang đăng nhập."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo AssistantConversationService."""
        super().__init__(**kwargs)
        self.conversation_service = AssistantConversationService()

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="page",
                type=int,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Trang tin nhắn cũ (mặc định 1).",
            ),
            OpenApiParameter(
                name="page_size",
                type=int,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Số tin mỗi trang (tối đa 100, mặc định 50).",
            ),
        ],
        responses=AssistantThreadResponseSerializer,
    )
    @require_permission(AssistantPermission.CHAT)
    def get(self, request: Request) -> CoreResponse:
        """Lấy tin nhắn gần nhất theo thứ tự thời gian trong luồng chat Web duy nhất."""
        params = AssistantThreadQueryValidateSerializer.validate_data(
            {
                "page": request.query_params.get("page", 1),
                "page_size": request.query_params.get("page_size", 50),
            }
        )
        data = self.conversation_service.get_web_thread_messages(
            self.get_actor(request),
            page=params["page"],
            page_size=params["page_size"],
        )
        return CoreResponse(AssistantThreadResponseSerializer(data).data)

    @extend_schema(responses={200: AssistantThreadClearResponseSerializer})
    @require_permission(AssistantPermission.CHAT)
    @rate_limit(CoreRateLimitKey.DEFAULT_WRITE)
    def delete(self, request: Request) -> CoreResponse:
        """Xóa toàn bộ tin nhắn khỏi luồng chat Web duy nhất để bắt đầu lại từ đầu."""
        deleted_count = self.conversation_service.clear_web_thread(self.get_actor(request))
        return CoreResponse(AssistantThreadClearResponseSerializer({"deleted_count": deleted_count}).data)
