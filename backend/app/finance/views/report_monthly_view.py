"""GET /finance/reports/monthly?year=: 12 tháng năm chọn + năm trước (dashboard)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.finance.permissions.report_permission import ReportPermission
from app.finance.serializers.responses.report_monthly_response_serializer import (
    ReportMonthlyResponseSerializer,
)
from app.finance.serializers.validates.report_monthly_validate_serializer import (
    ReportMonthlyValidateSerializer,
)
from app.finance.services.finance_report_service import FinanceReportService
from app.system.decorators.require_permission import require_permission


class ReportMonthlyView(CoreApiView):
    """Phạm vi theo quyền xem thu nhập (của mình, hoặc mọi người với `manage_all`)."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.finance_report_service = FinanceReportService()

    @extend_schema(responses=ReportMonthlyResponseSerializer)
    @require_permission(ReportPermission.READ)
    @validate_request(ReportMonthlyValidateSerializer)
    def get(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Số liệu VNĐ."""
        return CoreResponse(
            ReportMonthlyResponseSerializer(
                self.finance_report_service.monthly(
                    self.get_actor(request), validated_data["year"], validated_data.get("owner")
                )
            ).data
        )
