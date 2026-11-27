"""API GET /auth/social/<provider>/url."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.constants.core_rate_limit_key import CoreRateLimitKey
from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.serializers.responses.social_auth_url_response_serializer import (
    SocialAuthUrlResponseSerializer,
)
from app.system.serializers.validates.social_auth_url_validate_serializer import (
    SocialAuthUrlValidateSerializer,
)
from app.system.services.oauth_service import OAuthService


class SocialAuthUrlView(CoreApiView):
    """Lấy URL chuyển hướng tới trang đăng nhập của nhà cung cấp OAuth."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.oauth_service = OAuthService()

    @extend_schema(
        parameters=[SocialAuthUrlValidateSerializer],
        responses=SocialAuthUrlResponseSerializer,
    )
    @rate_limit(CoreRateLimitKey.PUBLIC_READ)
    @validate_request(SocialAuthUrlValidateSerializer)
    def get(self, request: Request, provider: str, validated_data: dict[str, Any]) -> CoreResponse:
        """Lấy URL xác thực OAuth.

        Args:
            request: Request.
            provider: Tên nhà cung cấp (google, github...).
            validated_data: Query parameters đã validate.

        Returns:
            URL chuyển hướng xác thực OAuth.
        """
        url = self.oauth_service.get_authorization_url(
            provider=provider,
            state=validated_data["state"],
            redirect_uri=validated_data["redirect_uri"],
        )
        return CoreResponse(SocialAuthUrlResponseSerializer({"authorization_url": url}).data)
