"""POST /system/notification-deliveries/{id}/retry: gửi lại một lần gửi."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.system.permissions.notification_delivery_permission import NotificationDeliveryPermission
from app.system.serializers.responses.notification_delivery_response_serializer import (
    NotificationDeliveryResponseSerializer,
)
from app.system.services.notification_delivery_service import NotificationDeliveryService


class NotificationDeliveryRetryView(CoreApiView):
    """Đưa về PENDING rồi gửi ngay."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.notification_delivery_service = NotificationDeliveryService()

    @extend_schema(request=None, responses=NotificationDeliveryResponseSerializer)
    @require_permission(NotificationDeliveryPermission.UPDATE)
    def post(self, request: Request, pk: Any) -> CoreResponse:
        """Kết quả sau khi gửi lại."""
        delivery = self.notification_delivery_service.retry(self.get_actor(request), pk)
        return CoreResponse(NotificationDeliveryResponseSerializer(delivery).data)
