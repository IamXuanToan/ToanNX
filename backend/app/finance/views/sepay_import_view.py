"""POST /finance/sepay/import: nhập giao dịch đã chọn ở màn xem trước."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.finance.permissions.income_permission import IncomePermission
from app.finance.permissions.sepay_permission import SepayPermission
from app.finance.serializers.responses.sepay_import_response_serializer import SepayImportResponseSerializer
from app.finance.serializers.validates.sepay_import_validate_serializer import SepayImportValidateSerializer
from app.finance.services.sepay_import_service import SepayImportService
from app.system.decorators.require_permission import require_permission


class SepayImportView(CoreApiView):
    """Gọi lại SePay, chỉ xử lý id đã chọn; cần cả quyền SePay và quyền tạo thu nhập."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.sepay_import_service = SepayImportService()

    @extend_schema(responses=SepayImportResponseSerializer)
    @require_permission(SepayPermission.MANAGE, IncomePermission.CREATE, require_all=True)
    @rate_limit("finance.sepay.call")
    @validate_request(SepayImportValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Số tạo/cập nhật/bỏ qua."""
        result = self.sepay_import_service.import_selected(
            self.get_actor(request),
            validated_data["date_from"],
            validated_data["date_to"],
            validated_data["ids"],
        )
        return CoreResponse(SepayImportResponseSerializer(result).data)
