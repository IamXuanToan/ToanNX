"""API GET /auth/me."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.modules.authentication.serializers.responses.current_user_response_serializer import (
    CurrentUserResponseSerializer,
)
from app.modules.authentication.services.current_user_service import CurrentUserService
from app.modules.iam.views.authenticated_api_view import AuthenticatedApiView


class MeView(AuthenticatedApiView):
    """Người dùng hiện tại, quyền hiệu lực và module đang bật."""

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
        profile = self.current_user_service.get_profile(self.get_actor(request).pk)
        return CoreResponse(CurrentUserResponseSerializer(profile).data)
