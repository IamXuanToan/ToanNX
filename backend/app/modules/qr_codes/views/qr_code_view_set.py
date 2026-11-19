"""CRUD mã QR.

GET    /qr_codes/codes?search=&qr_type=&owner=&ordering=&page=&page_size=
POST   /qr_codes/codes
GET    /qr_codes/codes/{id}
PATCH  /qr_codes/codes/{id}             (đổi nội dung/kiểu dáng → ảnh vẽ lại, giữ id ảnh)
DELETE /qr_codes/codes/{id}             (xóa mềm cả ảnh)
POST   /qr_codes/codes/bulk-delete
GET    /qr_codes/codes/{id}/history
"""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.modules.iam.types.permission_rule import permission_rule
from app.modules.qr_codes.filters.qr_code_filter import QrCodeFilter
from app.modules.qr_codes.models.qr_code import QrCode
from app.modules.qr_codes.permissions.qr_code_permission import QrCodePermission as P
from app.modules.qr_codes.serializers.responses.qr_code_detail_response_serializer import (
    QrCodeDetailResponseSerializer,
)
from app.modules.qr_codes.serializers.responses.qr_code_list_response_serializer import (
    QrCodeListResponseSerializer,
)
from app.modules.qr_codes.serializers.validates.qr_code_create_validate_serializer import (
    QrCodeCreateValidateSerializer,
)
from app.modules.qr_codes.serializers.validates.qr_code_update_validate_serializer import (
    QrCodeUpdateValidateSerializer,
)
from app.modules.qr_codes.services.qr_code_service import QrCodeService


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
    action_rate_limits = {"create": "qr_codes.create"}
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_delete": permission_rule(P.DELETE),
        "history": permission_rule(P.READ),
    }
