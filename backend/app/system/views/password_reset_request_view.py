"""API POST /auth/password-reset/request."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.permissions.csrf_protected import CsrfProtected
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.serializers.responses.password_reset_detail_response_serializer import (
    PasswordResetDetailResponseSerializer,
)
from app.system.serializers.validates.password_reset_request_validate_serializer import (
    PasswordResetRequestValidateSerializer,
)
from app.system.services.password_reset_service import PasswordResetService


class PasswordResetRequestView(CoreApiView):
    """Gửi email yêu cầu đặt lại mật khẩu với cơ chế chống user enumeration."""

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
    @rate_limit("system.password_reset.request")
    @validate_request(PasswordResetRequestValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Nhận email và gửi đường dẫn đặt lại mật khẩu nếu tài khoản tồn tại.

        Args:
            request: Request.
            validated_data: Body đã validate chứa email và locale.

        Returns:
            Thông báo kết quả.
        """
        message = self.password_reset_service.request_password_reset(
            request._request,
            validated_data["email"],
            locale=validated_data.get("locale", "vi"),
        )
        return CoreResponse({"detail": message})
