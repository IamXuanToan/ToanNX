"""Lịch sử thanh toán gia hạn (`/api/v1/workspace/subscription-payments`, chỉ đọc & xóa)."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.types.permission_rule import DENY, permission_rule
from app.workspace.filters.subscription_payment_filter import SubscriptionPaymentFilter
from app.workspace.models.subscription_payment import SubscriptionPayment
from app.workspace.permissions.subscription_payment_permission import (
    SubscriptionPaymentPermission as P,
)
from app.workspace.serializers.responses.subscription_payment_response_serializer import (
    SubscriptionPaymentResponseSerializer,
)
from app.workspace.services.subscription_payment_service import SubscriptionPaymentService


class SubscriptionPaymentViewSet(CoreModelViewSet[SubscriptionPayment]):
    """Tra cứu và xóa lịch sử thanh toán (chỉ tạo thông qua `/subscriptions/{id}/renew`)."""

    service_class = SubscriptionPaymentService
    filterset_class = SubscriptionPaymentFilter
    search_fields = ("subscription__name", "payment_method", "note")
    ordering_fields = ("paid_on", "amount_vnd", "created_at")
    ordering = ("-paid_on", "-created_at", "-pk")
    list_serializer_class = SubscriptionPaymentResponseSerializer
    detail_serializer_class = SubscriptionPaymentResponseSerializer
    http_method_names = ["get", "post", "delete", "head", "options"]
    bulk_delete_enabled = True
    history_enabled = False
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": DENY,
        "destroy": permission_rule(P.DELETE),
        "bulk_delete": permission_rule(P.DELETE),
    }
