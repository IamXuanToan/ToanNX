"""POST /finance/sepay/preview: xem trước giao dịch tiền vào từ SePay API."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.finance.constants.finance_rate_limit_key import FinanceRateLimitKey
from app.finance.permissions.sepay_permission import SepayPermission
from app.finance.serializers.responses.sepay_preview_row_response_serializer import (
    SepayPreviewRowResponseSerializer,
)
from app.finance.serializers.validates.sepay_range_validate_serializer import SepayRangeValidateSerializer
from app.finance.services.sepay_import_service import SepayImportService
from app.system.decorators.require_permission import require_permission


class SepayPreviewView(CoreApiView):
    """NEW / EXISTS / CHANGED / INVALID."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.sepay_import_service = SepayImportService()

    @extend_schema(responses=SepayPreviewRowResponseSerializer(many=True))
    @require_permission(SepayPermission.MANAGE)
    @rate_limit(FinanceRateLimitKey.SEPAY_CALL)
    @validate_request(SepayRangeValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Danh sách dòng."""
        rows = self.sepay_import_service.preview(
            self.get_actor(request), validated_data["date_from"], validated_data["date_to"]
        )
        return CoreResponse(SepayPreviewRowResponseSerializer(rows, many=True).data)
