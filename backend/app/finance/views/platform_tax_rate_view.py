"""GET/POST /finance/platforms/{id}/tax-rates · PATCH/DELETE …/tax-rates/{rate_id}."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.finance.permissions.platform_permission import PlatformPermission
from app.finance.serializers.responses.platform_tax_rate_mutation_response_serializer import (
    PlatformTaxRateMutationResponseSerializer,
)
from app.finance.serializers.responses.platform_tax_rate_response_serializer import (
    PlatformTaxRateResponseSerializer,
)
from app.finance.serializers.validates.platform_tax_rate_update_validate_serializer import (
    PlatformTaxRateUpdateValidateSerializer,
)
from app.finance.serializers.validates.platform_tax_rate_validate_serializer import (
    PlatformTaxRateValidateSerializer,
)
from app.finance.services.platform_service import PlatformService
from app.finance.services.platform_tax_rate_service import PlatformTaxRateService
from app.system.decorators.require_permission import require_permission


class PlatformTaxRateView(CoreApiView):
    """Lịch sử khấu trừ của một nền tảng."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.platform_service = PlatformService()
        self.platform_tax_rate_service = PlatformTaxRateService()

    @extend_schema(responses=PlatformTaxRateResponseSerializer(many=True))
    @require_permission(PlatformPermission.READ)
    def get(self, request: Request, pk: Any) -> CoreResponse:
        """Mới nhất trước."""
        platform = self.platform_service.get_by_id_for(self.get_actor(request), pk)
        return CoreResponse(
            PlatformTaxRateResponseSerializer(
                self.platform_tax_rate_service.list_for(platform), many=True
            ).data
        )

    @extend_schema(responses=PlatformTaxRateMutationResponseSerializer)
    @require_permission(PlatformPermission.UPDATE)
    @validate_request(PlatformTaxRateValidateSerializer)
    def post(self, request: Request, pk: Any, validated_data: dict[str, Any]) -> CoreResponse:
        """Thêm mốc; trả giao dịch bị ảnh hưởng."""
        actor = self.get_actor(request)
        entry, affected = self.platform_tax_rate_service.create(
            actor, self.platform_service.get_usable(actor, pk), validated_data
        )
        return CoreResponse(
            PlatformTaxRateMutationResponseSerializer({"entry": entry, "affected_income_ids": affected}).data,
            status=201,
        )


class PlatformTaxRateObjectView(CoreApiView):
    """Sửa/xóa một mốc."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.platform_service = PlatformService()
        self.platform_tax_rate_service = PlatformTaxRateService()

    @extend_schema(responses=PlatformTaxRateMutationResponseSerializer)
    @require_permission(PlatformPermission.UPDATE)
    @validate_request(PlatformTaxRateUpdateValidateSerializer)
    def patch(self, request: Request, pk: Any, rate_id: Any, validated_data: dict[str, Any]) -> CoreResponse:
        """Sửa mốc."""
        actor = self.get_actor(request)
        platform = self.platform_service.get_usable(actor, pk)
        entry, affected = self.platform_tax_rate_service.update(actor, platform, rate_id, validated_data)
        return CoreResponse(
            PlatformTaxRateMutationResponseSerializer({"entry": entry, "affected_income_ids": affected}).data
        )

    @extend_schema(responses=PlatformTaxRateMutationResponseSerializer)
    @require_permission(PlatformPermission.UPDATE)
    def delete(self, request: Request, pk: Any, rate_id: Any) -> CoreResponse:
        """Xóa mốc."""
        actor = self.get_actor(request)
        affected = self.platform_tax_rate_service.delete(
            actor, self.platform_service.get_usable(actor, pk), rate_id
        )
        return CoreResponse(
            PlatformTaxRateMutationResponseSerializer({"entry": None, "affected_income_ids": affected}).data
        )
