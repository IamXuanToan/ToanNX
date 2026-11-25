"""API công khai lấy Bảng Vinh danh (Đồng, Bạc, Vàng) còn hiệu lực đếm ngược."""

import uuid
from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.utilities.serializers.responses.donation_public_leaderboard_response_serializer import (
    DonationPublicLeaderboardResponseSerializer,
)
from app.utilities.services.donation_transaction_service import DonationTransactionService


class DonationPublicLeaderboardView(CoreApiView):
    """Bảng Vinh danh công khai trên trang Donate."""

    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service theo đúng quy chuẩn kiến trúc."""
        super().__init__(**kwargs)
        self.donation_service = DonationTransactionService()

    @extend_schema(
        summary="Bảng vinh danh ủng hộ công khai",
        description="Lấy top người ủng hộ Bảng Đồng, Bạc, Vàng còn hạn đếm ngược.",
        responses=DonationPublicLeaderboardResponseSerializer(many=True),
    )
    @rate_limit("public.read")
    def get(self, request: Request, page_id: uuid.UUID) -> CoreResponse:
        """Lấy danh sách người ủng hộ trên Bảng Vinh danh."""
        leaderboard = self.donation_service.list_public_leaderboard(page_id)
        return CoreResponse(DonationPublicLeaderboardResponseSerializer(leaderboard, many=True).data)
