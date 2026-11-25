"""API công khai lấy danh sách các lượt ủng hộ (Live Feed) cho trang Donate."""

import uuid
from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.utilities.serializers.responses.donation_public_feed_response_serializer import (
    DonationPublicFeedResponseSerializer,
)
from app.utilities.services.donation_transaction_service import DonationTransactionService


class DonationPublicFeedView(CoreApiView):
    """Feed ủng hộ công khai trên trang Donate."""

    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service theo đúng quy chuẩn kiến trúc."""
        super().__init__(**kwargs)
        self.donation_service = DonationTransactionService()

    @extend_schema(
        summary="Danh sách lượt ủng hộ công khai",
        description="Lấy danh sách lượt quyên góp gần nhất đã kiểm duyệt, hỗ trợ phân trang cuộn tiếp.",
        responses=DonationPublicFeedResponseSerializer(many=True),
    )
    @rate_limit("public.read")
    def get(self, request: Request, page_id: uuid.UUID) -> CoreResponse:
        """Lấy danh sách lượt ủng hộ công khai."""
        limit = min(max(1, int(request.query_params.get("limit", 20))), 100)
        page = max(1, int(request.query_params.get("page", 1)))
        feed = self.donation_service.list_public_feed(page_id, limit=limit, page=page)
        return CoreResponse(DonationPublicFeedResponseSerializer(feed, many=True).data)
