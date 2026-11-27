"""Cấu hình Chatbot AI dùng chung toàn hệ thống (Admin: `GET/PUT/PATCH /workspace/assistant/config`)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.constants.core_rate_limit_key import CoreRateLimitKey
from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.workspace.permissions.assistant_config_permission import AssistantConfigPermission
from app.workspace.serializers.responses.assistant_config_response_serializer import (
    AssistantConfigResponseSerializer,
)
from app.workspace.serializers.validates.assistant_config_update_validate_serializer import (
    AssistantConfigUpdateValidateSerializer,
)
from app.workspace.services.assistant_config_service import AssistantConfigService


class AssistantConfigView(CoreApiView):
    """Đọc và cập nhật Avatar, Tên, Policy, Model và Bot Telegram AI dùng chung."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo AssistantConfigService."""
        super().__init__(**kwargs)
        self.config_service = AssistantConfigService()

    @extend_schema(responses=AssistantConfigResponseSerializer)
    @require_permission(AssistantConfigPermission.READ)
    def get(self, request: Request) -> CoreResponse:
        """Lấy cấu hình Chatbot AI dùng chung cho màn Admin."""
        return CoreResponse(AssistantConfigResponseSerializer(self.config_service.get_config()).data)

    @extend_schema(
        request=AssistantConfigUpdateValidateSerializer,
        responses=AssistantConfigResponseSerializer,
    )
    @require_permission(AssistantConfigPermission.UPDATE)
    @rate_limit(CoreRateLimitKey.DEFAULT_WRITE)
    @validate_request(AssistantConfigUpdateValidateSerializer)
    def put(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Cập nhật cấu hình Chatbot AI (PUT)."""
        return self._save(request, validated_data)

    @extend_schema(
        request=AssistantConfigUpdateValidateSerializer,
        responses=AssistantConfigResponseSerializer,
    )
    @require_permission(AssistantConfigPermission.UPDATE)
    @rate_limit(CoreRateLimitKey.DEFAULT_WRITE)
    @validate_request(AssistantConfigUpdateValidateSerializer)
    def patch(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Cập nhật một phần cấu hình Chatbot AI (PATCH)."""
        return self._save(request, validated_data)

    def _save(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        updated = self.config_service.update_config(self.get_actor(request), validated_data)
        return CoreResponse(AssistantConfigResponseSerializer(updated).data)
