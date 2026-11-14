"""Public redirect của liên kết rút gọn."""

from typing import Any

from django.http import HttpResponseRedirect
from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.views.public_api_view import PublicApiView
from app.modules.short_links.services.short_link_service import ShortLinkService


class ShortLinkResolveView(PublicApiView):
    """Chuyển hướng công khai theo slug nếu link còn hoạt động."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service theo vòng đời request."""
        super().__init__(**kwargs)
        self.short_link_service = ShortLinkService()

    @extend_schema(responses={301: None, 302: None})
    def get(self, request: Request, slug: str) -> HttpResponseRedirect:
        """Trả Location đã lưu và mã 301/302."""
        destination, status = self.short_link_service.resolve(slug)
        response = HttpResponseRedirect(destination)
        response.status_code = status
        response["Cache-Control"] = "no-store" if status == 302 else "public, max-age=3600"
        return response
