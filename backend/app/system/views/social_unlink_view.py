"""API DELETE /auth/social/<provider>/unlink."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.constants.system_rate_limit_key import SystemRateLimitKey
from app.system.serializers.responses.social_unlink_response_serializer import (
    SocialUnlinkResponseSerializer,
)
from app.system.services.oauth_service import OAuthService


class SocialUnlinkView(CoreApiView):
    """Hủy liên kết tài khoản mạng xã hội của người dùng hiện tại."""

    permission_classes: list[type[BasePermission]] = [IsActiveAuthenticated]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.oauth_service = OAuthService()

    @extend_schema(responses=SocialUnlinkResponseSerializer)
    @rate_limit(SystemRateLimitKey.SOCIAL_UNLINK)
    def delete(self, request: Request, provider: str) -> CoreResponse:
        """Hủy liên kết nền tảng mạng xã hội.

        Args:
            request: Request.
            provider: Tên nhà cung cấp (google, github...).

        Returns:
            Xác nhận hủy liên kết thành công.
        """
        actor = self.get_actor(request)
        self.oauth_service.unlink(user=actor, provider=provider)
        return CoreResponse(SocialUnlinkResponseSerializer({"unlinked": True}).data)
