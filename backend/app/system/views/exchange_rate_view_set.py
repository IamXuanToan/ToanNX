"""Tỷ giá: danh sách (API + nhập tay), CRUD dòng nhập tay."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.filters.exchange_rate_filter import ExchangeRateFilter
from app.system.models.exchange_rate import ExchangeRate
from app.system.permissions.exchange_rate_permission import ExchangeRatePermission as P
from app.system.serializers.responses.exchange_rate_response_serializer import ExchangeRateResponseSerializer
from app.system.serializers.validates.exchange_rate_update_validate_serializer import (
    ExchangeRateUpdateValidateSerializer,
)
from app.system.serializers.validates.exchange_rate_validate_serializer import ExchangeRateValidateSerializer
from app.system.services.exchange_rate_service import ExchangeRateService
from app.system.types.permission_rule import permission_rule


class ExchangeRateViewSet(CoreModelViewSet[ExchangeRate]):
    """Dòng lấy từ API chỉ đọc."""

    service_class = ExchangeRateService
    filterset_class = ExchangeRateFilter
    ordering = ("-rate_date", "currency__code")
    ordering_fields = ("rate_date", "created_at")
    list_serializer_class = ExchangeRateResponseSerializer
    detail_serializer_class = ExchangeRateResponseSerializer
    create_serializer_class = ExchangeRateValidateSerializer
    update_serializer_class = ExchangeRateUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_delete": permission_rule(P.DELETE),
        "history": permission_rule(P.READ),
    }
