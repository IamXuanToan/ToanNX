"""API trang công khai."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.modules.custom_pages.serializers.responses.page_public_response_serializer import (
    PagePublicResponseSerializer,
)
from app.modules.custom_pages.services.page_service import PageService


class PagePublicView(CoreApiView):
    """Chỉ trả trang PUBLISHED và block đang hiển thị."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service theo vòng đời request."""
        super().__init__(**kwargs)
        self.page_service = PageService()

    @extend_schema(responses=PagePublicResponseSerializer)
    def get(self, request: Request, slug: str) -> CoreResponse:
        """Chi tiết công khai của trang theo slug."""
        return CoreResponse(PagePublicResponseSerializer(self.page_service.get_public(slug)).data)
