"""API POST /auth/password-reset/validate-token."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.constants.system_rate_limit_key import SystemRateLimitKey
from app.system.serializers.responses.password_reset_token_valid_response_serializer import (
    PasswordResetTokenValidResponseSerializer,
)
from app.system.serializers.validates.password_reset_validate_token_serializer import (
    PasswordResetValidateTokenSerializer,
)
from app.system.services.password_reset_service import PasswordResetService


class PasswordResetValidateTokenView(CoreApiView):
    """Kiểm tra token đặt lại mật khẩu có hợp lệ và còn thời hạn hay không."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.password_reset_service = PasswordResetService()

    @extend_schema(responses=PasswordResetTokenValidResponseSerializer)
    @rate_limit(SystemRateLimitKey.PASSWORD_RESET_VALIDATE)
    @validate_request(PasswordResetValidateTokenSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Xác thực token một lần.

        Args:
            request: Request.
            validated_data: Body đã validate chứa uid và token.

        Returns:
            Trạng thái hợp lệ.
        """
        self.password_reset_service.validate_reset_token(
            validated_data["uid"],
            validated_data["token"],
        )
        return CoreResponse({"valid": True})
