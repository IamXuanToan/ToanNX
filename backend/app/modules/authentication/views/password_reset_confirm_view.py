"""API POST /auth/password-reset/confirm."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.permissions.csrf_protected import CsrfProtected
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.modules.authentication.serializers.responses.password_reset_detail_response_serializer import (
    PasswordResetDetailResponseSerializer,
)
from app.modules.authentication.serializers.validates.password_reset_confirm_validate_serializer import (
    PasswordResetConfirmValidateSerializer,
)
from app.modules.authentication.services.password_reset_service import PasswordResetService


class PasswordResetConfirmView(CoreApiView):
    """Xác nhận đặt lại mật khẩu mới và thu hồi mọi phiên đăng nhập cũ."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny, CsrfProtected]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.password_reset_service = PasswordResetService()

    @extend_schema(responses=PasswordResetDetailResponseSerializer)
    @rate_limit("auth.password_reset_confirm")
    @validate_request(PasswordResetConfirmValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Cập nhật mật khẩu mới cho tài khoản.

        Args:
            request: Request.
            validated_data: Body đã validate gồm uid, token, new_password.

        Returns:
            Thông báo đặt lại mật khẩu thành công.
        """
        message = self.password_reset_service.confirm_password_reset(
            validated_data["uid"],
            validated_data["token"],
            validated_data["new_password"],
        )
        return CoreResponse({"detail": message})
