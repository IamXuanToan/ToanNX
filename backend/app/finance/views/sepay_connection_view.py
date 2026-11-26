"""GET/PUT/DELETE /finance/sepay/connection: kết nối SePay của chính mình."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.finance.constants.finance_rate_limit_key import FinanceRateLimitKey
from app.finance.permissions.sepay_permission import SepayPermission
from app.finance.serializers.responses.sepay_status_response_serializer import SepayStatusResponseSerializer
from app.finance.serializers.validates.sepay_connection_validate_serializer import (
    SepayConnectionValidateSerializer,
)
from app.finance.services.sepay_connection_service import SepayConnectionService
from app.system.decorators.require_permission import require_permission


class SepayConnectionView(CoreApiView):
    """Token chỉ ghi; trạng thái gồm URL webhook và secret riêng."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.sepay_connection_service = SepayConnectionService()

    @extend_schema(responses=SepayStatusResponseSerializer)
    @require_permission(SepayPermission.MANAGE)
    def get(self, request: Request) -> CoreResponse:
        """Trạng thái."""
        return CoreResponse(
            SepayStatusResponseSerializer(self.sepay_connection_service.status(self.get_actor(request))).data
        )

    @extend_schema(responses=SepayStatusResponseSerializer)
    @require_permission(SepayPermission.MANAGE)
    @rate_limit(FinanceRateLimitKey.SEPAY_CALL)
    @validate_request(SepayConnectionValidateSerializer)
    def put(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Lưu token (kiểm trước) / bật tắt."""
        actor = self.get_actor(request)
        self.sepay_connection_service.save(
            actor, validated_data.get("token") or None, validated_data.get("is_active")
        )
        return CoreResponse(SepayStatusResponseSerializer(self.sepay_connection_service.status(actor)).data)

    @extend_schema(responses={204: None})
    @require_permission(SepayPermission.MANAGE)
    def delete(self, request: Request) -> CoreResponse:
        """Xóa kết nối."""
        self.sepay_connection_service.delete(self.get_actor(request))
        return CoreResponse(None, status=204)
