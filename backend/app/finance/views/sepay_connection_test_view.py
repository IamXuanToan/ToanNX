"""POST /finance/sepay/connection/test: kiểm token SePay đã lưu."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.finance.permissions.sepay_permission import SepayPermission
from app.finance.serializers.responses.sepay_test_response_serializer import SepayTestResponseSerializer
from app.finance.services.sepay_connection_service import SepayConnectionService
from app.system.decorators.require_permission import require_permission


class SepayConnectionTestView(CoreApiView):
    """Gọi `/v2/bank-accounts`."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.sepay_connection_service = SepayConnectionService()

    @extend_schema(request=None, responses=SepayTestResponseSerializer)
    @require_permission(SepayPermission.MANAGE)
    @rate_limit("finance.sepay.call")
    def post(self, request: Request) -> CoreResponse:
        """Số tài khoản liên kết."""
        count = self.sepay_connection_service.test(self.get_actor(request))
        return CoreResponse(SepayTestResponseSerializer({"bank_account_count": count}).data)
