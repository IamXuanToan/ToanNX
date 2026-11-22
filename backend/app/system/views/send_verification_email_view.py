"""API POST /auth/send-verification-email."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.serializers.responses.password_reset_detail_response_serializer import (
    PasswordResetDetailResponseSerializer,
)
from app.system.services.email_verification_service import EmailVerificationService


class SendVerificationEmailView(CoreApiView):
    """Gửi email xác minh tài khoản cho người dùng đang đăng nhập."""

    permission_classes = [IsActiveAuthenticated]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số DRF.
        """
        super().__init__(**kwargs)
        self.verification_service = EmailVerificationService()

    @extend_schema(
        request=None,
        summary="Gửi lại email xác minh",
        description="Gửi email chứa liên kết xác minh tài khoản cho người dùng hiện tại.",
        responses=PasswordResetDetailResponseSerializer,
    )
    @rate_limit("system.email_verification.send")
    def post(self, request: Request) -> CoreResponse:
        """Thực hiện gửi email xác minh.

        Args:
            request: Request HTTP.

        Returns:
            Thông báo trạng thái.
        """
        locale = request.headers.get("Accept-Language", "vi")[:2]
        message = self.verification_service.send_verification_email(
            request._request,
            self.get_actor(request),
            locale=locale,
        )
        return CoreResponse({"message": message})
