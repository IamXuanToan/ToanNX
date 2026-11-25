"""GET /finance/reports/summary?year=&month=: tổng thu nhập, đã/chưa khấu trừ."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.finance.permissions.report_permission import ReportPermission
from app.finance.serializers.responses.report_summary_response_serializer import (
    ReportSummaryResponseSerializer,
)
from app.finance.serializers.validates.report_summary_validate_serializer import (
    ReportSummaryValidateSerializer,
)
from app.finance.services.finance_report_service import FinanceReportService
from app.system.decorators.require_permission import require_permission


class ReportSummaryView(CoreApiView):
    """Phạm vi theo quyền xem thu nhập (của mình, hoặc mọi người với `manage_all`)."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.finance_report_service = FinanceReportService()

    @extend_schema(responses=ReportSummaryResponseSerializer)
    @require_permission(ReportPermission.READ)
    @validate_request(ReportSummaryValidateSerializer)
    def get(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Số liệu VNĐ."""
        return CoreResponse(
            ReportSummaryResponseSerializer(
                self.finance_report_service.summary(
                    self.get_actor(request),
                    validated_data["year"],
                    validated_data["month"],
                    validated_data.get("owner"),
                )
            ).data
        )
