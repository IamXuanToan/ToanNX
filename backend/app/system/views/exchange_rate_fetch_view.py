"""POST /system/exchange-rates/fetch: lấy lại tỷ giá Vietcombank cho một ngày."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.system.permissions.exchange_rate_permission import ExchangeRatePermission
from app.system.serializers.responses.exchange_rate_response_serializer import ExchangeRateResponseSerializer
from app.system.serializers.validates.exchange_rate_fetch_validate_serializer import (
    ExchangeRateFetchValidateSerializer,
)
from app.system.services.exchange_rate_service import ExchangeRateService


class ExchangeRateFetchView(CoreApiView):
    """Ghi đè dòng đệm API của ngày đó."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.exchange_rate_service = ExchangeRateService()

    @extend_schema(responses=ExchangeRateResponseSerializer)
    @require_permission(ExchangeRatePermission.CREATE)
    @validate_request(ExchangeRateFetchValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Dòng tỷ giá sau khi lấy."""
        rate = self.exchange_rate_service.refetch(
            self.get_actor(request), validated_data["currency_id"], validated_data["date"]
        )
        return CoreResponse(ExchangeRateResponseSerializer(rate).data)
