"""POST /finance/incomes/{id}/refresh-rate: lấy lại tỷ giá API rồi tính lại VNĐ và khấu trừ."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.finance.permissions.income_permission import IncomePermission
from app.finance.serializers.responses.income_response_serializer import IncomeResponseSerializer
from app.finance.services.income_service import IncomeService
from app.system.decorators.require_permission import require_permission


class IncomeRefreshRateView(CoreApiView):
    """Chỉ áp dụng giao dịch dùng tỷ giá tự động."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.income_service = IncomeService()

    @extend_schema(request=None, responses=IncomeResponseSerializer)
    @require_permission(IncomePermission.UPDATE)
    def post(self, request: Request, pk: Any) -> CoreResponse:
        """Giao dịch sau khi cập nhật."""
        return CoreResponse(
            IncomeResponseSerializer(self.income_service.refresh_rate(self.get_actor(request), pk)).data
        )
