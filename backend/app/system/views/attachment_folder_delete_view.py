"""API xóa nhánh và tùy chọn xóa mềm file bên trong."""

from typing import Any
from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.serializers.core_bulk_result_response_serializer import CoreBulkResultResponseSerializer
from app.core.views.core_api_view import CoreApiView
from app.system.decorators.require_permission import require_permission
from app.system.permissions.attachment_folder_permission import (
    AttachmentFolderPermission,
)
from app.system.serializers.validates.attachment_folder_delete_validate_serializer import (
    AttachmentFolderDeleteValidateSerializer,
)
from app.system.services.attachment_folder_service import AttachmentFolderService


class AttachmentFolderDeleteView(CoreApiView):
    """Service kiểm tra thêm quyền xóa file trước mọi thay đổi."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service theo request."""
        super().__init__(**kwargs)
        self.attachment_folder_service = AttachmentFolderService()

    @extend_schema(responses=CoreBulkResultResponseSerializer)
    @require_permission(AttachmentFolderPermission.FOLDER_DELETE)
    @validate_request(AttachmentFolderDeleteValidateSerializer)
    def post(self, request: Request, pk: UUID, validated_data: dict[str, Any]) -> CoreResponse:
        """Xóa nhánh và trả số thư mục đã xóa mềm."""
        count = self.attachment_folder_service.delete_tree(self.get_actor(request), pk, **validated_data)
        return CoreResponse(CoreBulkResultResponseSerializer({"count": count}).data)
