"""API POST /auth/accept-invitation."""

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
from app.system.constants.system_rate_limit_key import SystemRateLimitKey
from app.system.serializers.responses.current_user_response_serializer import (
    CurrentUserResponseSerializer,
)
from app.system.serializers.validates.accept_invitation_validate_serializer import (
    AcceptInvitationValidateSerializer,
)
from app.system.services.auth_cookie_service import AuthCookieService
from app.system.services.user_invitation_service import UserInvitationService


class AcceptInvitationView(CoreApiView):
    """Kích hoạt tài khoản, thiết lập mật khẩu lần đầu và đăng nhập luôn vào hệ thống."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny, CsrfProtected]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.auth_cookie_service = AuthCookieService()
        self.invitation_service = UserInvitationService()

    @extend_schema(
        summary="Kích hoạt tài khoản qua lời mời",
        description="Thiết lập họ tên, tên người dùng, mật khẩu và tự động đăng nhập vào hệ thống.",
        responses=CurrentUserResponseSerializer,
    )
    @rate_limit(SystemRateLimitKey.INVITATION_ACCEPT)
    @validate_request(AcceptInvitationValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Kích hoạt tài khoản qua lời mời.

        Args:
            request: Request HTTP.
            validated_data: Dữ liệu kích hoạt.

        Returns:
            Hồ sơ người dùng kèm cookie phiên.
        """
        result = self.invitation_service.accept_invitation(
            token=validated_data["token"],
            full_name=validated_data["full_name"],
            username=validated_data.get("username"),
            password=validated_data["password"],
            request=request._request,
        )
        rotate_token(request._request)

        response = CoreResponse(CurrentUserResponseSerializer(result.profile).data)
        self.auth_cookie_service.set_cookies(response, result)
        return response
