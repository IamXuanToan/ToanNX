"""GET /finance/incomes/export: CSV giao dịch theo đúng bộ lọc của danh sách."""

from typing import Any

from django.http import HttpResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.request import Request

from app.core.views.core_api_view import CoreApiView
from app.finance.filters.income_filter import IncomeFilter
from app.finance.permissions.income_permission import IncomePermission
from app.finance.services.income_service import IncomeService
from app.system.decorators.require_permission import require_permission

CSV_CONTENT_TYPE = "text/csv; charset=utf-8"
UTF8_BOM = "\ufeff"


class IncomeExportView(CoreApiView):
    """Ngoại lệ có chủ đích với envelope chuẩn: trả file CSV (BOM UTF-8 để Excel đọc đúng tiếng Việt)."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.income_service = IncomeService()

    @extend_schema(responses={200: OpenApiResponse(OpenApiTypes.BINARY, description="CSV")})
    @require_permission(IncomePermission.READ)  # type: ignore[arg-type]  # trả file CSV, không phải envelope
    def get(self, request: Request) -> HttpResponse:
        """File `thu-nhap.csv`."""
        queryset = IncomeFilter(
            request.query_params, queryset=self.income_service.get_queryset_for(self.get_actor(request))
        ).qs
        response = HttpResponse(
            UTF8_BOM + self.income_service.export_csv(queryset.order_by("received_at")),
            content_type=CSV_CONTENT_TYPE,
        )
        response["Content-Disposition"] = 'attachment; filename="thu-nhap.csv"'
        return response
