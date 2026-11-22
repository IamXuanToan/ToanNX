"""API danh mục ngân hàng VietQR: GET /utilities/qr-codes/banks (chỉ cần đăng nhập)."""

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.utilities.constants.vietqr_banks import VIETQR_BANKS
from app.utilities.serializers.responses.qr_bank_response_serializer import QrBankResponseSerializer


class QrBankView(CoreApiView):
    """Danh mục tĩnh, không chứa dữ liệu người dùng."""

    permission_classes: list[type[BasePermission]] = [IsActiveAuthenticated]

    @extend_schema(responses=QrBankResponseSerializer(many=True))
    def get(self, request: Request) -> CoreResponse:
        """Danh sách ngân hàng.

        Args:
            request: Request.

        Returns:
            Ngân hàng theo thứ tự khai báo.
        """
        return CoreResponse(QrBankResponseSerializer(VIETQR_BANKS, many=True).data)
