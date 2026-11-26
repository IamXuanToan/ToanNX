"""CRUD Dịch vụ & Gói đăng ký định kỳ (`/api/v1/workspace/subscriptions` + `/renew`)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.types.permission_rule import permission_rule
from app.workspace.constants.workspace_rate_limit_key import WorkspaceRateLimitKey
from app.workspace.filters.subscription_filter import SubscriptionFilter
from app.workspace.models.subscription import Subscription
from app.workspace.permissions.subscription_permission import SubscriptionPermission as P
from app.workspace.serializers.responses.subscription_payment_response_serializer import (
    SubscriptionPaymentResponseSerializer,
)
from app.workspace.serializers.responses.subscription_response_serializer import (
    SubscriptionResponseSerializer,
)
from app.workspace.serializers.validates.subscription_bulk_update_validate_serializer import (
    SubscriptionBulkUpdateValidateSerializer,
)
from app.workspace.serializers.validates.subscription_create_validate_serializer import (
    SubscriptionCreateValidateSerializer,
)
from app.workspace.serializers.validates.subscription_renew_validate_serializer import (
    SubscriptionRenewValidateSerializer,
)
from app.workspace.serializers.validates.subscription_update_validate_serializer import (
    SubscriptionUpdateValidateSerializer,
)
from app.workspace.services.subscription_service import SubscriptionService


class SubscriptionViewSet(CoreModelViewSet[Subscription]):
    """Quản lý gói định kỳ, bật/tắt hàng loạt và ghi nhận thanh toán gia hạn."""

    service_class = SubscriptionService
    filterset_class = SubscriptionFilter
    search_fields = ("name", "provider", "payment_method")
    ordering_fields = ("renew_date", "amount_vnd", "created_at")
    ordering = ("renew_date", "-created_at", "-pk")
    list_serializer_class = SubscriptionResponseSerializer
    detail_serializer_class = SubscriptionResponseSerializer
    create_serializer_class = SubscriptionCreateValidateSerializer
    update_serializer_class = SubscriptionUpdateValidateSerializer
    bulk_update_serializer_class = SubscriptionBulkUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_rate_limits = {
        "create": WorkspaceRateLimitKey.SUBSCRIPTION_CREATE,
        "renew": WorkspaceRateLimitKey.SUBSCRIPTION_RENEW,
    }
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_update": permission_rule(P.UPDATE),
        "bulk_delete": permission_rule(P.DELETE),
        "history": permission_rule(P.READ),
        "renew": permission_rule(P.UPDATE),
    }

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service riêng phục vụ action `@action renew`."""
        super().__init__(**kwargs)
        self.subscription_service = SubscriptionService()

    @extend_schema(
        request=SubscriptionRenewValidateSerializer,
        responses=SubscriptionPaymentResponseSerializer,
    )
    @action(detail=True, methods=["post"])
    def renew(self, request: Request, pk: Any = None) -> CoreResponse:
        """Ghi nhận đã thanh toán gia hạn và đẩy `renew_date` sang chu kỳ tiếp theo."""
        data = SubscriptionRenewValidateSerializer.validate_data(request.data)
        payment = self.subscription_service.renew(self.get_actor(request), pk, data)
        return CoreResponse(SubscriptionPaymentResponseSerializer(payment).data, status=201)
