"""Chuyển hướng công khai: GET /short_links/resolve/{slug} → 301/302 + `Location`.

Link tắt/xóa/slug sai → 404; hết hạn → 410 `SHORT_LINK_EXPIRED`. FE `toannx.com/s/{slug}` gọi endpoint này.
"""

from typing import Any

from django.http import HttpResponseRedirect
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.views.core_api_view import CoreApiView
from app.modules.short_links.services.short_link_service import ShortLinkService


class ShortLinkResolveView(CoreApiView):
    """Công khai, chỉ đọc; không chạy xác thực để cookie hỏng không làm hỏng redirect."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service theo vòng đời request."""
        super().__init__(**kwargs)
        self.short_link_service = ShortLinkService()

    @extend_schema(responses={301: None, 302: None})
    @rate_limit("public.read")
    def get(self, request: Request, slug: str) -> HttpResponseRedirect:
        """Trả `Location` đã lưu và mã 301/302.

        Args:
            request: Request.
            slug: Slug của link.

        Returns:
            Redirect; 302 không cache, 301 cache 1 giờ; luôn `noindex`.
        """
        destination, status = self.short_link_service.resolve(slug)
        response = HttpResponseRedirect(destination)
        response.status_code = status
        response["Cache-Control"] = "no-store" if status == 302 else "public, max-age=3600"
        response["X-Robots-Tag"] = "noindex"
        return response
