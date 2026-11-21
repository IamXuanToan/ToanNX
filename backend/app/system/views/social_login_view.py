"""API POST /auth/social/<provider>/login."""

from typing import Any

from django.middleware.csrf import rotate_token
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.permissions.csrf_protected import CsrfProtected
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.serializers.responses.current_user_response_serializer import (
    CurrentUserResponseSerializer,
)
from app.system.serializers.validates.social_auth_code_validate_serializer import (
    SocialAuthCodeValidateSerializer,
)
from app.system.services.auth_cookie_service import AuthCookieService
from app.system.services.oauth_service import OAuthService


class SocialLoginView(CoreApiView):
    """Đăng nhập bằng tài khoản mạng xã hội (Google, GitHub...). Không cho phép đăng ký."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny, CsrfProtected]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.oauth_service = OAuthService()

    @extend_schema(
        request=SocialAuthCodeValidateSerializer,
        responses=CurrentUserResponseSerializer,
    )
    @rate_limit("system.social.auth")
    @validate_request(SocialAuthCodeValidateSerializer)
    def post(self, request: Request, provider: str, validated_data: dict[str, Any]) -> CoreResponse:
        """Đăng nhập qua OAuth.

        Args:
            request: Request.
            provider: Tên nhà cung cấp (google, github...).
            validated_data: Body chứa code và redirect_uri.

        Returns:
            Hồ sơ người dùng hiện tại + cookie phiên.
        """
        result = self.oauth_service.login(
            request=request._request,
            provider=provider,
            code=validated_data["code"],
            redirect_uri=validated_data["redirect_uri"],
        )
        rotate_token(request._request)

        response = CoreResponse(CurrentUserResponseSerializer(result.profile).data)
        AuthCookieService.set_cookies(response, result)
        return response
