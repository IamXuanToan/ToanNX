"""API xóa mềm file hàng loạt."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer
from app.core.serializers.core_bulk_result_response_serializer import CoreBulkResultResponseSerializer
from app.modules.attachment.permissions.attachment_permission import AttachmentPermission
from app.modules.attachment.services.attachment_service import AttachmentService
from app.modules.iam.decorators.require_permission import require_permission
from app.modules.iam.views.member_api_view import MemberApiView


class AttachmentBulkDeleteView(MemberApiView):
    """Xóa các file actor được phép thao tác; không yêu cầu staff."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service cho vòng đời request."""
        super().__init__(**kwargs)
        self.attachment_service = AttachmentService()

    @extend_schema(responses=CoreBulkResultResponseSerializer)
    @require_permission(AttachmentPermission.FILE_DELETE)
    @validate_request(CoreBulkIdsValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Xóa mềm các id đã validate, trả số file trong lô."""
        count = self.attachment_service.bulk_delete(self.get_actor(request), validated_data["ids"])
        return CoreResponse(CoreBulkResultResponseSerializer({"count": count}).data)
