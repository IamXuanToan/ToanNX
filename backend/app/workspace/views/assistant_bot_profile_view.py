"""Thông tin nhận diện tối giản của Chatbot AI (`GET /workspace/assistant/bot-profile`)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.workspace.permissions.assistant_permission import AssistantPermission
from app.workspace.serializers.responses.assistant_bot_profile_response_serializer import (
    AssistantBotProfileResponseSerializer,
)
from app.workspace.services.assistant_config_service import AssistantConfigService


class AssistantBotProfileView(CoreApiView):
    """Trả về Avatar, Tên và Model AI đang kích hoạt để nút tròn Portal hiển thị."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo AssistantConfigService."""
        super().__init__(**kwargs)
        self.config_service = AssistantConfigService()

    @extend_schema(responses=AssistantBotProfileResponseSerializer)
    @require_permission(AssistantPermission.CHAT)
    def get(self, request: Request) -> CoreResponse:
        """Lấy thông tin chỉ đọc của Chatbot AI (không lộ Policy hay quyền sửa)."""
        return CoreResponse(AssistantBotProfileResponseSerializer(self.config_service.get_bot_profile()).data)
