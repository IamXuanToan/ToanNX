"""API GET /system/settings/public."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.serializers.responses.public_setting_response_serializer import (
    PublicSettingResponseSerializer,
)
from app.system.services.setting_service import SettingService


class PublicSettingView(CoreApiView):
    """Cung cấp các tham số cấu hình công khai (không cần đăng nhập)."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.setting_service = SettingService()

    @extend_schema(responses=PublicSettingResponseSerializer)
    @rate_limit("public.read")
    def get(self, request: Request) -> CoreResponse:
        """Lấy danh sách cấu hình công khai cho frontend client.

        Args:
            request: Request HTTP.

        Returns:
            Dữ liệu cấu hình công khai.
        """
        public_data = self.setting_service.get_public_settings()
        payload = {
            "auth_google_enabled": public_data.get("auth_google_enabled", True),
            "auth_github_enabled": public_data.get("auth_github_enabled", True),
            "settings": public_data,
        }
        return CoreResponse(payload)
