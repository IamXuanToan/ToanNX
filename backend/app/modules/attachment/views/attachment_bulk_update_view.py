"""Chuyển thư mục file hàng loạt."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.serializers.core_bulk_result_response_serializer import CoreBulkResultResponseSerializer
from app.modules.attachment.permissions.attachment_permission import AttachmentPermission
from app.modules.attachment.serializers.validates.attachment_bulk_update_validate_serializer import (
    AttachmentBulkUpdateValidateSerializer,
)
from app.modules.attachment.services.attachment_service import AttachmentService
from app.modules.iam.decorators.require_permission import require_permission
from app.modules.iam.views.member_api_view import MemberApiView


class AttachmentBulkUpdateView(MemberApiView):
    """Gom file vào cùng nhóm trong một transaction."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service theo vòng đời request."""
        super().__init__(**kwargs)
        self.attachment_service = AttachmentService()

    @extend_schema(responses=CoreBulkResultResponseSerializer)
    @require_permission(AttachmentPermission.FILE_UPDATE)
    @validate_request(AttachmentBulkUpdateValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Thực thi chuyển nhóm sau khi đã kiểm tra quyền và validate body."""
        count = self.attachment_service.bulk_update(
            self.get_actor(request), validated_data["ids"], {"folder_id": validated_data["folder_id"]}
        )
        return CoreResponse(CoreBulkResultResponseSerializer({"count": count}).data)
