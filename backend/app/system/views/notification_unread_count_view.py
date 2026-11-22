"""GET /system/notifications/unread-count: số chưa đọc theo tab (FE gọi định kỳ khi không có push)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.system.permissions.notification_permission import NotificationPermission
from app.system.serializers.responses.notification_unread_count_response_serializer import (
    NotificationUnreadCountResponseSerializer,
)
from app.system.services.notification_service import NotificationService


class NotificationUnreadCountView(CoreApiView):
    """Một truy vấn theo index chuông."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.notification_service = NotificationService()

    @extend_schema(responses=NotificationUnreadCountResponseSerializer)
    @require_permission(NotificationPermission.READ)
    def get(self, request: Request) -> CoreResponse:
        """`{personal, system}`."""
        counts = self.notification_service.unread_counts(self.get_actor(request))
        data = {"personal": counts["PERSONAL"], "system": counts["SYSTEM"]}
        return CoreResponse(NotificationUnreadCountResponseSerializer(data).data)
