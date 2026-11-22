"""Giao dịch thu nhập (nhập tay hoặc từ SePay)."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.finance.filters.income_filter import IncomeFilter
from app.finance.models.income import Income
from app.finance.permissions.income_permission import IncomePermission as P
from app.finance.serializers.responses.income_response_serializer import IncomeResponseSerializer
from app.finance.serializers.validates.income_update_validate_serializer import IncomeUpdateValidateSerializer
from app.finance.serializers.validates.income_validate_serializer import IncomeValidateSerializer
from app.finance.services.income_service import IncomeService
from app.system.types.permission_rule import permission_rule


class IncomeViewSet(CoreModelViewSet[Income]):
    """Giao dịch thu nhập (nhập tay hoặc từ SePay)."""

    service_class = IncomeService
    filterset_class = IncomeFilter
    search_fields = ("content", "reference_code", "note")
    ordering = ("-received_at", "-pk")
    ordering_fields = ("received_at", "amount", "created_at")
    list_serializer_class = IncomeResponseSerializer
    detail_serializer_class = IncomeResponseSerializer
    create_serializer_class = IncomeValidateSerializer
    update_serializer_class = IncomeUpdateValidateSerializer
    history_enabled = True
    bulk_delete_enabled = True
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "history": permission_rule(P.READ),
        "bulk_delete": permission_rule(P.DELETE),
    }
