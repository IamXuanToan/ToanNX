"""API xem trước mã QR: POST /qr_codes/preview (không ghi DB)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.modules.iam.decorators.require_permission import require_permission
from app.modules.qr_codes.permissions.qr_codes_permission import QrCodesPermission
from app.modules.qr_codes.serializers.responses.qr_preview_response_serializer import (
    QrPreviewResponseSerializer,
)
from app.modules.qr_codes.serializers.validates.qr_preview_validate_serializer import (
    QrPreviewValidateSerializer,
)
from app.modules.qr_codes.services.qr_code_service import QrCodeService


class QrPreviewView(CoreApiView):
    """Payload + SVG để form hiển thị trực tiếp khi gõ."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.qr_code_service = QrCodeService()

    @extend_schema(responses=QrPreviewResponseSerializer)
    @require_permission(QrCodesPermission.CREATE, QrCodesPermission.UPDATE)
    @rate_limit("qr_codes.preview")
    @validate_request(QrPreviewValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Xem trước mã QR.

        Args:
            request: Request.
            validated_data: `qr_type`, `content`, `design` đã validate.

        Returns:
            Payload và SVG data URL.
        """
        preview = self.qr_code_service.preview(
            validated_data["qr_type"], validated_data["content"], validated_data["design"]
        )
        return CoreResponse(QrPreviewResponseSerializer(preview).data)
