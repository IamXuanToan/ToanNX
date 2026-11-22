"""API POST /attachments/{id}/visibility: chuyển file giữa công khai và riêng tư."""

from typing import Any
from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.system.permissions.attachment_permission import AttachmentPermission
from app.system.serializers.responses.attachment_detail_response_serializer import (
    AttachmentDetailResponseSerializer,
)
from app.system.serializers.validates.attachment_visibility_validate_serializer import (
    AttachmentVisibilityValidateSerializer,
)
from app.system.services.attachment_service import AttachmentService


class AttachmentVisibilityView(CoreApiView):
    """Người upload hoặc người có `manage_all`; cần quyền sửa file."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service."""
        super().__init__(**kwargs)
        self.attachment_service = AttachmentService()

    @extend_schema(
        request=AttachmentVisibilityValidateSerializer, responses=AttachmentDetailResponseSerializer
    )
    @require_permission(AttachmentPermission.FILE_UPDATE)
    @validate_request(AttachmentVisibilityValidateSerializer)
    def post(self, request: Request, pk: UUID, validated_data: dict[str, Any]) -> CoreResponse:
        """Đổi chế độ xem và trả thông tin file mới."""
        attachment = self.attachment_service.set_visibility(
            self.get_actor(request), pk, validated_data["visibility"]
        )
        return CoreResponse(AttachmentDetailResponseSerializer(attachment).data)
