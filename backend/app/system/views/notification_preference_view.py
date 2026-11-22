"""GET/PUT /system/notifications/preferences: ma trận sự kiện × kênh của chính mình."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.system.permissions.notification_preference_permission import NotificationPreferencePermission
from app.system.serializers.responses.notification_preference_response_serializer import (
    NotificationPreferenceResponseSerializer,
)
from app.system.serializers.validates.notification_preference_validate_serializer import (
    NotificationPreferenceValidateSerializer,
)
from app.system.services.notification_preference_service import NotificationPreferenceService


class NotificationPreferenceView(CoreApiView):
    """Chỉ sự kiện người dùng có quyền nhận."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.notification_preference_service = NotificationPreferenceService()

    @extend_schema(responses=NotificationPreferenceResponseSerializer)
    @require_permission(NotificationPreferencePermission.READ)
    def get(self, request: Request) -> CoreResponse:
        """Kênh dùng được + ma trận hiện tại."""
        return CoreResponse(self._serialize(self.get_actor(request)))

    @extend_schema(
        request=NotificationPreferenceValidateSerializer, responses=NotificationPreferenceResponseSerializer
    )
    @require_permission(NotificationPreferencePermission.UPDATE)
    @validate_request(NotificationPreferenceValidateSerializer)
    def put(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Đồng bộ rồi trả ma trận mới."""
        actor = self.get_actor(request)
        self.notification_preference_service.update(actor, validated_data["items"])
        return CoreResponse(self._serialize(actor))

    def _serialize(self, actor: Any) -> Any:
        data = {
            "channels": self.notification_preference_service.available_channels(actor),
            "items": self.notification_preference_service.matrix(actor),
        }
        return NotificationPreferenceResponseSerializer(data).data
