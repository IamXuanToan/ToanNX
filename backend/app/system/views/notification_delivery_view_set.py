"""Nhật ký gửi thông báo (chỉ đọc): của mình, hoặc mọi người với `manage_all`."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.filters.notification_delivery_filter import NotificationDeliveryFilter
from app.system.models.notification_delivery import NotificationDelivery
from app.system.permissions.notification_delivery_permission import NotificationDeliveryPermission as P
from app.system.serializers.responses.notification_delivery_response_serializer import (
    NotificationDeliveryResponseSerializer,
)
from app.system.services.notification_delivery_service import NotificationDeliveryService
from app.system.types.permission_rule import DENY, permission_rule


class NotificationDeliveryViewSet(CoreModelViewSet[NotificationDelivery]):
    """Nhật ký gửi thông báo."""

    service_class = NotificationDeliveryService
    filterset_class = NotificationDeliveryFilter
    search_fields = ("notification__title", "target")
    ordering = ("-created_at",)
    ordering_fields = ("created_at", "status")
    list_serializer_class = NotificationDeliveryResponseSerializer
    detail_serializer_class = NotificationDeliveryResponseSerializer
    bulk_delete_enabled = True
    http_method_names = ["get", "post", "delete", "head", "options"]
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": DENY,  # lần gửi chỉ do NotificationService tạo; POST mở cho bulk-delete và gửi lại
        "destroy": permission_rule(P.DELETE),
        "bulk_delete": permission_rule(P.DELETE),
    }
