"""API GET /auth/social/accounts."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.serializers.responses.user_social_account_summary_response_serializer import (
    UserSocialAccountSummaryResponseSerializer,
)
from app.system.services.oauth_service import OAuthService


class UserSocialAccountView(CoreApiView):
    """Danh sách nền tảng OAuth và trạng thái liên kết của người dùng hiện tại."""

    permission_classes: list[type[BasePermission]] = [IsActiveAuthenticated]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.oauth_service = OAuthService()

    @extend_schema(responses=UserSocialAccountSummaryResponseSerializer(many=True))
    @rate_limit("public.read")
    def get(self, request: Request) -> CoreResponse:
        """Lấy danh sách trạng thái liên kết mạng xã hội.

        Args:
            request: Request.

        Returns:
            Danh sách các nền tảng kèm trạng thái kết nối.
        """
        actor = self.get_actor(request)
        accounts = self.oauth_service.list_accounts(actor)
        return CoreResponse(UserSocialAccountSummaryResponseSerializer(accounts, many=True).data)
