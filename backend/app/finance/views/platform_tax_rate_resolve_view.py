"""GET /finance/platforms/{id}/tax-rate?date=: mốc khấu trừ áp dụng ngày đó (form nhập tay)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.finance.permissions.platform_permission import PlatformPermission
from app.finance.serializers.responses.platform_tax_rate_response_serializer import (
    PlatformTaxRateResponseSerializer,
)
from app.finance.serializers.validates.platform_tax_rate_resolve_validate_serializer import (
    PlatformTaxRateResolveValidateSerializer,
)
from app.finance.services.platform_service import PlatformService
from app.finance.services.platform_tax_rate_service import PlatformTaxRateService
from app.system.decorators.require_permission import require_permission


class PlatformTaxRateResolveView(CoreApiView):
    """Null khi nền tảng chưa có mốc cho ngày đó."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.platform_service = PlatformService()
        self.platform_tax_rate_service = PlatformTaxRateService()

    @extend_schema(responses=PlatformTaxRateResponseSerializer)
    @require_permission(PlatformPermission.READ)
    @validate_request(PlatformTaxRateResolveValidateSerializer)
    def get(self, request: Request, pk: Any, validated_data: dict[str, Any]) -> CoreResponse:
        """Mốc áp dụng."""
        platform = self.platform_service.get_by_id_for(self.get_actor(request), pk)
        entry = self.platform_tax_rate_service.resolve(platform.pk, validated_data["date"])
        return CoreResponse(PlatformTaxRateResponseSerializer(entry).data if entry else None)
