"""Tiền tệ."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.filters.currency_filter import CurrencyFilter
from app.system.models.currency import Currency
from app.system.permissions.currency_permission import CurrencyPermission as P
from app.system.serializers.responses.currency_response_serializer import CurrencyResponseSerializer
from app.system.serializers.validates.currency_bulk_update_validate_serializer import (
    CurrencyBulkUpdateValidateSerializer,
)
from app.system.serializers.validates.currency_update_validate_serializer import (
    CurrencyUpdateValidateSerializer,
)
from app.system.serializers.validates.currency_validate_serializer import CurrencyValidateSerializer
from app.system.services.currency_service import CurrencyService
from app.system.types.permission_rule import permission_rule


class CurrencyViewSet(CoreModelViewSet[Currency]):
    """Danh mục tiền tệ; tiền tệ gốc bị khóa mã/trạng thái."""

    service_class = CurrencyService
    filterset_class = CurrencyFilter
    search_fields = ("code", "name")
    ordering = ("position", "code")
    ordering_fields = ("position", "code", "created_at")
    list_serializer_class = CurrencyResponseSerializer
    detail_serializer_class = CurrencyResponseSerializer
    create_serializer_class = CurrencyValidateSerializer
    update_serializer_class = CurrencyUpdateValidateSerializer
    bulk_update_serializer_class = CurrencyBulkUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_update": permission_rule(P.UPDATE),
        "bulk_delete": permission_rule(P.DELETE),
        "history": permission_rule(P.READ),
    }
