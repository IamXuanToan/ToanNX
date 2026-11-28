"""API sinh và biên tập nội dung Tiptap bằng AI (kèm RAG cá nhân)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.workspace.constants.workspace_rate_limit_key import WorkspaceRateLimitKey
from app.workspace.permissions.assistant_permission import AssistantPermission as P
from app.workspace.serializers.responses.assistant_compose_response_serializer import (
    AssistantComposeResponseSerializer,
)
from app.workspace.serializers.validates.assistant_compose_validate_serializer import (
    AssistantComposeValidateSerializer,
)
from app.workspace.services.assistant_compose_service import AssistantComposeService


class AssistantComposeView(CoreApiView):
    """Sinh HTML chuẩn Tiptap từ prompt người dùng và ngữ cảnh RAG cá nhân."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service sinh nội dung Tiptap."""
        super().__init__(**kwargs)
        self.compose_service = AssistantComposeService()

    @extend_schema(
        request=AssistantComposeValidateSerializer,
        responses=AssistantComposeResponseSerializer,
    )
    @require_permission(P.CHAT)
    @rate_limit(WorkspaceRateLimitKey.ASSISTANT_CHAT)
    @validate_request(AssistantComposeValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Nhận yêu cầu viết/sửa nội dung Tiptap, trả HTML sạch + model + nguồn RAG."""
        actor = self.get_actor(request)
        data = self.compose_service.compose(actor, validated_data)
        return CoreResponse(AssistantComposeResponseSerializer(data).data)
