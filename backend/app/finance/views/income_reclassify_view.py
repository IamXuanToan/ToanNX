"""POST /finance/incomes/reclassify: nhận diện lại (bỏ qua nền tảng đã khóa)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.finance.permissions.income_permission import IncomePermission
from app.finance.serializers.responses.income_bulk_result_response_serializer import (
    IncomeBulkResultResponseSerializer,
)
from app.finance.serializers.validates.income_reclassify_validate_serializer import (
    IncomeReclassifyValidateSerializer,
)
from app.finance.services.income_service import IncomeService
from app.system.decorators.require_permission import require_permission


class IncomeReclassifyView(CoreApiView):
    """Chỉ trên giao dịch người gọi được thấy."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.income_service = IncomeService()

    @extend_schema(responses=IncomeBulkResultResponseSerializer)
    @require_permission(IncomePermission.UPDATE)
    @validate_request(IncomeReclassifyValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Số giao dịch đổi nền tảng."""
        changed = self.income_service.reclassify(self.get_actor(request), validated_data["ids"] or None)
        return CoreResponse(IncomeBulkResultResponseSerializer({"changed": changed}).data)
