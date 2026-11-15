"""API POST /auth/login."""

from typing import Any

from django.middleware.csrf import rotate_token
from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.csrf_public_api_view import CsrfPublicApiView
from app.modules.authentication.serializers.responses.current_user_response_serializer import (
    CurrentUserResponseSerializer,
)
from app.modules.authentication.serializers.validates.login_validate_serializer import (
    LoginValidateSerializer,
)
from app.modules.authentication.services.auth_cookie_service import AuthCookieService
from app.modules.authentication.services.auth_service import AuthService


class LoginView(CsrfPublicApiView):
    """Đăng nhập bằng email hoặc tên người dùng + mật khẩu (không có đăng ký)."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.auth_service = AuthService()

    @extend_schema(responses=CurrentUserResponseSerializer)
    @validate_request(LoginValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Đăng nhập.

        Args:
            request: Request.
            validated_data: Body đã validate.

        Returns:
            Hồ sơ người dùng hiện tại + cookie phiên.
        """
        result = self.auth_service.login(
            request._request, validated_data["identifier"], validated_data["password"]
        )
        rotate_token(request._request)  # Chống fixation cho CSRF token.

        response = CoreResponse(CurrentUserResponseSerializer(result.profile).data)
        AuthCookieService.set_cookies(response, result)
        return response
