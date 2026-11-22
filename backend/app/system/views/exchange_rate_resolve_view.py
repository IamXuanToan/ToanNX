"""GET /system/exchange-rates/resolve: tỷ giá dùng cho một ngày (form nhập ngoại tệ)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.system.permissions.exchange_rate_permission import ExchangeRatePermission
from app.system.serializers.responses.exchange_rate_resolve_response_serializer import (
    ExchangeRateResolveResponseSerializer,
)
from app.system.serializers.validates.exchange_rate_resolve_validate_serializer import (
    ExchangeRateResolveValidateSerializer,
)
from app.system.services.exchange_rate_service import ExchangeRateService


class ExchangeRateResolveView(CoreApiView):
    """Đệm DB → Vietcombank → lùi tối đa 7 ngày."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.exchange_rate_service = ExchangeRateService()

    @extend_schema(responses=ExchangeRateResolveResponseSerializer)
    @require_permission(ExchangeRatePermission.READ)
    @validate_request(ExchangeRateResolveValidateSerializer)
    def get(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Tỷ giá + ngày thật của tỷ giá."""
        fetched = self.exchange_rate_service.resolve_by_id(
            validated_data["currency_id"], validated_data["date"], validated_data["rate_source"]
        )
        return CoreResponse(ExchangeRateResolveResponseSerializer(fetched).data)
