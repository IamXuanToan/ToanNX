"""POST /system/notifications/{id}/read · POST /system/notifications/read-all."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.constants.notification_scope import NotificationScope
from app.system.decorators.require_permission import require_permission
from app.system.permissions.notification_permission import NotificationPermission
from app.system.serializers.responses.notification_response_serializer import NotificationResponseSerializer
from app.system.serializers.responses.notification_unread_count_response_serializer import (
    NotificationUnreadCountResponseSerializer,
)
from app.system.serializers.validates.notification_read_all_validate_serializer import (
    NotificationReadAllValidateSerializer,
)
from app.system.services.notification_service import NotificationService


class NotificationReadView(CoreApiView):
    """Đánh dấu đã đọc tất cả (theo tab); trả số chưa đọc mới."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.notification_service = NotificationService()

    @extend_schema(
        request=NotificationReadAllValidateSerializer, responses=NotificationUnreadCountResponseSerializer
    )
    @require_permission(NotificationPermission.READ)
    @validate_request(NotificationReadAllValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Đánh dấu rồi trả số chưa đọc."""
        actor = self.get_actor(request)
        self.notification_service.mark_all_read(actor, validated_data.get("scope"))
        counts = self.notification_service.unread_counts(actor)
        return CoreResponse(NotificationUnreadCountResponseSerializer(self._counts(counts)).data)

    @staticmethod
    def _counts(counts: dict[str, int]) -> dict[str, int]:
        return {
            "personal": counts[NotificationScope.PERSONAL],
            "system": counts[NotificationScope.SYSTEM],
        }


class NotificationReadObjectView(CoreApiView):
    """Đánh dấu một thông báo đã đọc."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.notification_service = NotificationService()

    @extend_schema(request=None, responses=NotificationResponseSerializer)
    @require_permission(NotificationPermission.READ)
    def post(self, request: Request, pk: Any) -> CoreResponse:
        """Thông báo sau khi đánh dấu."""
        notification = self.notification_service.mark_read(self.get_actor(request), pk)
        return CoreResponse(NotificationResponseSerializer(notification).data)
