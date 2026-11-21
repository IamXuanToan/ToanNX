"""API GET /auth/invitation."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.exceptions.validation_error import ValidationError
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.serializers.responses.invitation_detail_response_serializer import (
    InvitationDetailResponseSerializer,
)
from app.system.services.user_invitation_service import UserInvitationService


class InvitationValidateView(CoreApiView):
    """Kiểm tra tính hợp lệ của token lời mời và trả về thông tin người dùng được mời."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số DRF.
        """
        super().__init__(**kwargs)
        self.invitation_service = UserInvitationService()

    @extend_schema(
        summary="Kiểm tra token lời mời",
        description="Xác thực token lời mời tham gia và lấy thông tin người dùng được mời.",
        responses=InvitationDetailResponseSerializer,
    )
    @rate_limit("system.invitation.validate")
    def get(self, request: Request) -> CoreResponse:
        """Kiểm tra token lời mời.

        Args:
            request: Request HTTP kèm query param token.

        Returns:
            Thông tin người dùng được mời.
        """
        token = request.query_params.get("token", "").strip()
        if not token:
            raise ValidationError(
                "Thiếu token lời mời tham gia.",
                details={"token": ["Tham số này là bắt buộc."]},
            )

        user = self.invitation_service.validate_invitation_token(token)
        serializer = InvitationDetailResponseSerializer(
            {"email": user.email, "full_name": user.full_name, "username": user.username}
        )
        return CoreResponse(serializer.data)
