"""API công khai cho khách ẩn danh gửi góp ý / báo lỗi trên Custom Page & ShortLink."""

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.request import Request

from app.core.decorators.rate_limit import rate_limit
from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.utilities.constants.utilities_rate_limit_key import UtilitiesRateLimitKey
from app.utilities.serializers.responses.page_feedback_public_response_serializer import (
    PageFeedbackPublicResponseSerializer,
)
from app.utilities.serializers.validates.page_feedback_public_create_validate_serializer import (
    PageFeedbackPublicCreateValidateSerializer,
)
from app.utilities.services.page_feedback_service import PageFeedbackService


class PageFeedbackPublicView(CoreApiView):
    """Nhận góp ý ẩn danh từ trang công khai (`AllowAny`, giới hạn tốc độ theo IP)."""

    permission_classes = (AllowAny,)

    def __init__(self, **kwargs: object) -> None:
        """Khởi tạo service xử lý góp ý."""
        super().__init__(**kwargs)
        self.feedback_service = PageFeedbackService()

    @extend_schema(
        request=PageFeedbackPublicCreateValidateSerializer,
        responses=PageFeedbackPublicResponseSerializer,
    )
    @rate_limit(UtilitiesRateLimitKey.FEEDBACK_SUBMIT)
    @validate_request(PageFeedbackPublicCreateValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, object]) -> CoreResponse:
        """Lưu góp ý và gửi thông báo tới chủ sở hữu trang/link."""
        forwarded = str(request.META.get("HTTP_X_FORWARDED_FOR") or "")
        client_ip = (
            forwarded.split(",")[0].strip() if forwarded else str(request.META.get("REMOTE_ADDR") or "")
        )
        feedback = self.feedback_service.submit_public(dict(validated_data), client_ip=client_ip)
        return CoreResponse(PageFeedbackPublicResponseSerializer(feedback).data, status=201)
