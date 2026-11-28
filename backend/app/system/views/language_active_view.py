"""API công khai trả danh sách ngôn ngữ đang bật (`GET /api/v1/system/languages/active`)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.constants.core_rate_limit_key import CoreRateLimitKey
from app.core.decorators.rate_limit import rate_limit
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.serializers.responses.language_response_serializer import LanguageResponseSerializer
from app.system.services.language_service import LanguageService


class LanguageActiveView(CoreApiView):
    """Cung cấp danh sách ngôn ngữ đang bật cho cả Admin và Client Portal (cache Redis)."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service ngôn ngữ."""
        super().__init__(**kwargs)
        self.language_service = LanguageService()

    @extend_schema(responses=LanguageResponseSerializer(many=True))
    @rate_limit(CoreRateLimitKey.PUBLIC_READ)
    def get(self, request: Request) -> CoreResponse:
        """Trả danh sách ngôn ngữ đang kích hoạt theo thứ tự `sort_order`."""
        return CoreResponse(self.language_service.list_active_public())
