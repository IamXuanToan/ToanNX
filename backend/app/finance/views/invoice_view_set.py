"""Hóa đơn / chứng từ."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.finance.filters.invoice_filter import InvoiceFilter
from app.finance.models.invoice import Invoice
from app.finance.permissions.invoice_permission import InvoicePermission as P
from app.finance.serializers.responses.invoice_response_serializer import InvoiceResponseSerializer
from app.finance.serializers.validates.invoice_update_validate_serializer import (
    InvoiceUpdateValidateSerializer,
)
from app.finance.serializers.validates.invoice_validate_serializer import InvoiceValidateSerializer
from app.finance.services.invoice_service import InvoiceService
from app.system.types.permission_rule import permission_rule


class InvoiceViewSet(CoreModelViewSet[Invoice]):
    """Hóa đơn / chứng từ."""

    service_class = InvoiceService
    filterset_class = InvoiceFilter
    search_fields = ("number", "issuer")
    ordering = ("-issued_on", "-created_at")
    ordering_fields = ("issued_on", "created_at")
    list_serializer_class = InvoiceResponseSerializer
    detail_serializer_class = InvoiceResponseSerializer
    create_serializer_class = InvoiceValidateSerializer
    update_serializer_class = InvoiceUpdateValidateSerializer
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
