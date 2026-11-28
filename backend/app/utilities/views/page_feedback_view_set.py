"""CRUD & xử lý Góp ý / Báo lỗi trên Custom Page & ShortLink (Client & Admin)."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.types.permission_rule import DENY, permission_rule
from app.utilities.filters.page_feedback_filter import PageFeedbackFilter
from app.utilities.models.page_feedback import PageFeedback
from app.utilities.permissions.page_feedback_permission import PageFeedbackPermission as P
from app.utilities.serializers.responses.page_feedback_detail_response_serializer import (
    PageFeedbackDetailResponseSerializer,
)
from app.utilities.serializers.responses.page_feedback_list_response_serializer import (
    PageFeedbackListResponseSerializer,
)
from app.utilities.serializers.responses.page_feedback_thank_response_serializer import (
    PageFeedbackThankResponseSerializer,
)
from app.utilities.serializers.validates.page_feedback_bulk_update_validate_serializer import (
    PageFeedbackBulkUpdateValidateSerializer,
)
from app.utilities.serializers.validates.page_feedback_thank_validate_serializer import (
    PageFeedbackThankValidateSerializer,
)
from app.utilities.serializers.validates.page_feedback_update_validate_serializer import (
    PageFeedbackUpdateValidateSerializer,
)
from app.utilities.services.page_feedback_service import PageFeedbackService


class PageFeedbackViewSet(CoreModelViewSet[PageFeedback]):
    """Client thấy góp ý thuộc trang/link của mình; `manage_all` thấy toàn hệ thống và lọc theo user."""

    service_class = PageFeedbackService
    service: PageFeedbackService
    filterset_class = PageFeedbackFilter
    search_fields = ("target_title", "target_url", "message", "sender_name", "sender_email")
    ordering_fields = ("status", "feedback_type", "target_type", "created_at", "updated_at", "thanked_at")
    ordering = ("-created_at", "-pk")
    list_serializer_class = PageFeedbackListResponseSerializer
    detail_serializer_class = PageFeedbackDetailResponseSerializer
    update_serializer_class = PageFeedbackUpdateValidateSerializer
    bulk_update_serializer_class = PageFeedbackBulkUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": DENY,
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_update": permission_rule(P.UPDATE),
        "bulk_delete": permission_rule(P.DELETE),
        "history": permission_rule(P.READ),
        "thank": permission_rule(P.THANK),
    }

    @extend_schema(
        request=PageFeedbackThankValidateSerializer,
        responses=PageFeedbackThankResponseSerializer,
    )
    @action(detail=True, methods=["post"], url_path="thank")
    def thank(self, request: Request, pk: Any = None) -> CoreResponse:
        """Gửi email cảm ơn tới người đã góp ý theo mẫu hệ thống/cá nhân."""
        serializer = PageFeedbackThankValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = self.service.thank_sender(self.get_actor(request), pk, serializer.validated_data)
        return CoreResponse(PageFeedbackThankResponseSerializer(result).data)
