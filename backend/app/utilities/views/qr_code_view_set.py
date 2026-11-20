"""CRUD mã QR.

GET    /utilities/qr-codes?search=&qr_type=&owner=&ordering=&page=&page_size=
POST   /utilities/qr-codes
GET    /utilities/qr-codes/{id}
PATCH  /utilities/qr-codes/{id}             (đổi nội dung/kiểu dáng → ảnh vẽ lại, giữ id ảnh)
DELETE /utilities/qr-codes/{id}             (xóa mềm cả ảnh)
POST   /utilities/qr-codes/bulk-delete
GET    /utilities/qr-codes/{id}/history
"""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.iam.types.permission_rule import permission_rule
from app.utilities.filters.qr_code_filter import QrCodeFilter
from app.utilities.models.qr_code import QrCode
from app.utilities.permissions.qr_code_permission import QrCodePermission as P
from app.utilities.serializers.responses.qr_code_detail_response_serializer import (
    QrCodeDetailResponseSerializer,
)
from app.utilities.serializers.responses.qr_code_list_response_serializer import (
    QrCodeListResponseSerializer,
)
from app.utilities.serializers.validates.qr_code_create_validate_serializer import (
    QrCodeCreateValidateSerializer,
)
from app.utilities.serializers.validates.qr_code_update_validate_serializer import (
    QrCodeUpdateValidateSerializer,
)
from app.utilities.services.qr_code_service import QrCodeService


class QrCodeViewSet(CoreModelViewSet[QrCode]):
    """Mã QR của chính mình; có `manage_all` thì thấy của mọi người."""

    service_class = QrCodeService
    filterset_class = QrCodeFilter
    search_fields = ("name",)
    ordering_fields = ("name", "qr_type", "created_at", "updated_at")
    ordering = ("-created_at", "-pk")
    list_serializer_class = QrCodeListResponseSerializer
    detail_serializer_class = QrCodeDetailResponseSerializer
    create_serializer_class = QrCodeCreateValidateSerializer
    update_serializer_class = QrCodeUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_rate_limits = {"create": "utilities.qr_code.create"}
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_delete": permission_rule(P.DELETE),
        "history": permission_rule(P.READ),
    }
