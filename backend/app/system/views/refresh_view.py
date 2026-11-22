"""API POST /auth/refresh."""

from typing import Any

from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request
from rest_framework.response import Response

from app.core.exceptions.authentication_error import AuthenticationError
from app.core.permissions.csrf_protected import CsrfProtected
from app.core.responses.core_error_response import CoreErrorResponse
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.serializers.responses.current_user_response_serializer import (
    CurrentUserResponseSerializer,
)
from app.system.services.auth_cookie_service import AuthCookieService
from app.system.services.auth_service import AuthService


class RefreshView(CoreApiView):
    """Làm mới phiên bằng refresh token trong cookie."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny, CsrfProtected]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.auth_cookie_service = AuthCookieService()
        self.auth_service = AuthService()

    @extend_schema(request=None, responses=CurrentUserResponseSerializer)
    def post(self, request: Request) -> Response:
        """Xoay vòng refresh token.

        Lỗi xác thực trả 401 và xóa cookie để client không lặp refresh.

        Args:
            request: Request.

        Returns:
            Hồ sơ người dùng hiện tại + cookie mới.
        """
        raw_token = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE_NAME, "")
        try:
            result = self.auth_service.refresh(request._request, raw_token)
        except AuthenticationError as exc:
            error_response = CoreErrorResponse(exc.code, exc.message, exc.status_code)
            self.auth_cookie_service.clear_cookies(error_response)
            return error_response

        response = CoreResponse(CurrentUserResponseSerializer(result.profile).data)
        self.auth_cookie_service.set_cookies(response, result)
        return response
