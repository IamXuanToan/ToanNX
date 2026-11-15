"""API POST /auth/logout-all."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.modules.authentication.serializers.responses.logout_all_response_serializer import (
    LogoutAllResponseSerializer,
)
from app.modules.authentication.services.auth_cookie_service import AuthCookieService
from app.modules.authentication.services.auth_session_service import AuthSessionService


class LogoutAllView(CoreApiView):
    """Đăng xuất khỏi mọi thiết bị."""

    permission_classes: list[type[BasePermission]] = [IsActiveAuthenticated]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.auth_session_service = AuthSessionService()

    @extend_schema(request=None, responses=LogoutAllResponseSerializer)
    def post(self, request: Request) -> CoreResponse:
        """Thu hồi mọi phiên của người dùng.

        Args:
            request: Request.

        Returns:
            Số phiên đã thu hồi.
        """
        revoked = self.auth_session_service.revoke_all(self.get_actor(request), "logout_all")
        response = CoreResponse(LogoutAllResponseSerializer({"revoked_sessions": revoked}).data)
        AuthCookieService.clear_cookies(response)
        return response
