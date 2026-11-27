"""API công khai cho trang trung gian `/s/{slug}`."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.request import Request

from app.core.constants.core_rate_limit_key import CoreRateLimitKey
from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.utils.client_ip import get_client_ip
from app.utilities.constants.utilities_rate_limit_key import UtilitiesRateLimitKey
from app.utilities.serializers.responses.short_link_destination_response_serializer import (
    ShortLinkDestinationResponseSerializer,
)
from app.utilities.serializers.responses.short_link_public_response_serializer import (
    ShortLinkPublicResponseSerializer,
)
from app.utilities.serializers.validates.short_link_unlock_validate_serializer import (
    ShortLinkUnlockValidateSerializer,
)
from app.utilities.services.short_link_service import ShortLinkService


class ShortLinkResolveView(CoreApiView):
    """Trả dữ liệu trang trung gian; POST kiểm mật khẩu trước khi trả đích."""

    authentication_classes: list[Any] = []
    permission_classes: list[type[BasePermission]] = [AllowAny]

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service theo vòng đời request."""
        super().__init__(**kwargs)
        self.short_link_service = ShortLinkService()

    @extend_schema(responses=ShortLinkPublicResponseSerializer)
    @rate_limit(CoreRateLimitKey.PUBLIC_READ)
    def get(self, request: Request, slug: str) -> CoreResponse:
        """Trả thông tin công khai cho trang trung gian, không chuyển HTTP.

        Args:
            request: Request công khai.
            slug: Slug trong URL ngắn.

        Returns:
            Thông tin trang trung gian với HTTP 200.
        """
        link = self.short_link_service.get_public_link(slug)
        client_ip = get_client_ip(request)
        user_agent = str(request.META.get("HTTP_USER_AGENT") or "")
        self.short_link_service.record_access(link, client_ip=client_ip, user_agent=user_agent)
        response = CoreResponse(ShortLinkPublicResponseSerializer(link).data)
        response["Cache-Control"] = "no-store"
        response["X-Robots-Tag"] = "noindex"
        return response

    @extend_schema(responses=ShortLinkDestinationResponseSerializer)
    @rate_limit(UtilitiesRateLimitKey.SHORT_LINK_UNLOCK)
    @validate_request(ShortLinkUnlockValidateSerializer)
    def post(self, request: Request, slug: str, validated_data: dict[str, Any]) -> CoreResponse:
        """Kiểm mật khẩu với giới hạn số lần thử rồi trả URL đích.

        Args:
            request: Request công khai.
            slug: Slug trong URL ngắn.
            validated_data: Mật khẩu đã validate.

        Returns:
            URL đích khi người xem nhập đúng mật khẩu.
        """
        destination = self.short_link_service.unlock(slug, validated_data["password"])
        response = CoreResponse({"destination_url": destination})
        response["Cache-Control"] = "no-store"
        response["X-Robots-Tag"] = "noindex"
        return response
