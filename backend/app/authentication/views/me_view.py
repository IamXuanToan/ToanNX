"""API GET /auth/me và PATCH /auth/me."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from app.authentication.serializers.responses.current_user_response_serializer import (
    CurrentUserResponseSerializer,
)
from app.authentication.serializers.validates.me_update_validate_serializer import (
    MeUpdateValidateSerializer,
)
from app.authentication.services.current_user_service import CurrentUserService
from app.core.decorators.validate_request import validate_request
from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView


class MeView(CoreApiView):
    """Người dùng hiện tại, quyền hiệu lực và module đang bật."""

    permission_classes: list[type[BasePermission]] = [IsActiveAuthenticated]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.current_user_service = CurrentUserService()

    @extend_schema(responses=CurrentUserResponseSerializer)
    def get(self, request: Request) -> CoreResponse:
        """Hồ sơ người dùng hiện tại.

        Args:
            request: Request.

        Returns:
            Hồ sơ.
        """
        profile = self.current_user_service.get_profile(self.get_actor(request))
        return CoreResponse(CurrentUserResponseSerializer(profile).data)

    @extend_schema(request=MeUpdateValidateSerializer, responses=CurrentUserResponseSerializer)
    @validate_request(MeUpdateValidateSerializer)
    def patch(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Cập nhật thông tin hồ sơ cá nhân của người dùng hiện tại.

        Args:
            request: Request.
            validated_data: Dữ liệu đã validate.

        Returns:
            Hồ sơ sau cập nhật.
        """
        actor = self.get_actor(request)
        profile = self.current_user_service.update_profile(actor, validated_data)
        return CoreResponse(CurrentUserResponseSerializer(profile).data)
