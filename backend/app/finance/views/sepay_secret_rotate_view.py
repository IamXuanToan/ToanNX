"""POST /finance/sepay/connection/rotate-secret: tạo secret webhook mới."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.finance.permissions.sepay_permission import SepayPermission
from app.finance.serializers.responses.sepay_status_response_serializer import SepayStatusResponseSerializer
from app.finance.services.sepay_connection_service import SepayConnectionService
from app.system.decorators.require_permission import require_permission


class SepaySecretRotateView(CoreApiView):
    """Secret cũ hết hiệu lực ngay; nhớ dán secret mới vào SePay."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.sepay_connection_service = SepayConnectionService()

    @extend_schema(request=None, responses=SepayStatusResponseSerializer)
    @require_permission(SepayPermission.MANAGE)
    def post(self, request: Request) -> CoreResponse:
        """Trạng thái với secret mới."""
        actor = self.get_actor(request)
        self.sepay_connection_service.rotate_secret(actor)
        return CoreResponse(SepayStatusResponseSerializer(self.sepay_connection_service.status(actor)).data)
