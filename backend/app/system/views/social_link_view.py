"""API POST /auth/social/<provider>/link."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.serializers.responses.user_social_account_summary_response_serializer import (
    UserSocialAccountSummaryResponseSerializer,
)
from app.system.serializers.validates.social_auth_code_validate_serializer import (
    SocialAuthCodeValidateSerializer,
)
from app.system.services.oauth_service import OAuthService


class SocialLinkView(CoreApiView):
    """Liên kết tài khoản mạng xã hội (Google, GitHub...) vào tài khoản hiện tại."""

    permission_classes: list[type[BasePermission]] = [IsActiveAuthenticated]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.oauth_service = OAuthService()

    @extend_schema(
        request=SocialAuthCodeValidateSerializer,
        responses=UserSocialAccountSummaryResponseSerializer,
    )
    @rate_limit("system.social.link")
    @validate_request(SocialAuthCodeValidateSerializer)
    def post(self, request: Request, provider: str, validated_data: dict[str, Any]) -> CoreResponse:
        """Thực hiện liên kết OAuth.

        Args:
            request: Request.
            provider: Tên nhà cung cấp (google, github...).
            validated_data: Body chứa code và redirect_uri.

        Returns:
            Thông tin liên kết mới được thiết lập.
        """
        actor = self.get_actor(request)
        account = self.oauth_service.link(
            user=actor,
            provider=provider,
            code=validated_data["code"],
            redirect_uri=validated_data["redirect_uri"],
        )
        return CoreResponse(
            UserSocialAccountSummaryResponseSerializer(
                {
                    "provider": account.provider,
                    "is_configured": True,
                    "is_connected": True,
                    "email": account.email,
                    "display_name": account.display_name,
                    "avatar_url": account.avatar_url,
                    "connected_at": account.created_at.isoformat(),
                }
            ).data
        )
