"""Trang công khai: GET /utilities/pages/public/{segment}/{slug}.

- `PUBLISHED` → 200, `preview: false`, cache công khai ngắn.
- Chưa công khai mà người xem đọc được trang ở API quản lý → 200, `preview: true`,
  `private, no-store`, `noindex`.
- Còn lại → 404 giống hệt nhau (không lộ trang tồn tại).
"""

from typing import Any

from django.contrib.auth.models import AnonymousUser
from drf_spectacular.utils import extend_schema
from rest_framework import exceptions
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.constants.core_rate_limit_key import CoreRateLimitKey
from app.core.decorators.rate_limit import rate_limit
from app.core.exceptions.app_exception import AppException
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.utilities.serializers.responses.page_public_response_serializer import (
    PagePublicResponseSerializer,
)
from app.utilities.services.page_service import PageService


class PagePublicView(CoreApiView):
    """Công khai nhưng cần biết ai đang xem (bảng override của CoreApiView, dòng 5)."""

    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service theo vòng đời request."""
        super().__init__(**kwargs)
        self.page_service = PageService()

    def perform_authentication(self, request: Request) -> None:
        """Token hỏng/hết hạn = khách (không trả 401 trên trang công khai)."""
        try:
            request.user  # noqa: B018 - truy cập để DRF chạy xác thực
        except (exceptions.APIException, AppException):
            request.user = AnonymousUser()
            request.auth = None

    @extend_schema(responses=PagePublicResponseSerializer)
    @rate_limit(CoreRateLimitKey.PUBLIC_READ)
    def get(self, request: Request, segment: str, slug: str) -> CoreResponse:
        """Dữ liệu trang công khai (hoặc bản nháp cho người có quyền).

        Args:
            request: Request.
            segment: Đường dẫn giữa.
            slug: Slug trang.

        Returns:
            Trang đã lọc nội dung.
        """
        viewer = request.user if request.user.is_authenticated else None
        data = self.page_service.get_public(segment, slug, viewer)
        response = CoreResponse(PagePublicResponseSerializer(data).data)
        if data["preview"]:
            response["Cache-Control"] = "private, no-store"
            response["X-Robots-Tag"] = "noindex"
        else:
            response["Cache-Control"] = "public, max-age=60"
        return response
