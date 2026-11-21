"""API POST /auth/verify-email."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.serializers.responses.password_reset_detail_response_serializer import (
    PasswordResetDetailResponseSerializer,
)
from app.system.serializers.validates.email_verification_validate_serializer import (
    EmailVerificationValidateSerializer,
)
from app.system.services.email_verification_service import EmailVerificationService


class VerifyEmailView(CoreApiView):
    """Xác thực token và kích hoạt trạng thái xác minh email."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số DRF.
        """
        super().__init__(**kwargs)
        self.verification_service = EmailVerificationService()

    @extend_schema(
        summary="Xác minh email qua token",
        description="Kiểm tra token xác minh và đánh dấu email người dùng đã được xác minh.",
        responses=PasswordResetDetailResponseSerializer,
    )
    @rate_limit("system.email_verification.verify")
    @validate_request(EmailVerificationValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Xử lý xác minh email.

        Args:
            request: Request HTTP.
            validated_data: Dữ liệu chứa token.

        Returns:
            Thông báo thành công.
        """
        user = self.verification_service.verify_email(validated_data["token"])
        return CoreResponse({"message": f"Địa chỉ email {user.email} đã được xác minh thành công."})
