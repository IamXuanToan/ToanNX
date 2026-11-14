"""API file đính kèm.

GET    /attachments?search=&content_type=&ordering=&page=&page_size=
POST   /attachments              (multipart/form-data, field `file`)
GET    /attachments/{id}
DELETE /attachments/{id}         (xóa mềm)
"""

from rest_framework.parsers import JSONParser, MultiPartParser

from app.modules.attachment.filters.attachment_filter import AttachmentFilter
from app.modules.attachment.models.attachment import Attachment
from app.modules.attachment.permissions.attachment_permission import AttachmentPermission
from app.modules.attachment.serializers.responses.attachment_detail_response_serializer import (
    AttachmentDetailResponseSerializer,
)
from app.modules.attachment.serializers.validates.attachment_upload_validate_serializer import (
    AttachmentUploadValidateSerializer,
)
from app.modules.attachment.services.attachment_service import AttachmentService
from app.modules.iam.types.permission_rule import permission_rule
from app.modules.iam.views.admin_model_view_set import AdminModelViewSet


class AttachmentViewSet(AdminModelViewSet[Attachment]):
    """Upload, xem, xóa mềm file."""

    service_class = AttachmentService
    parser_classes = [MultiPartParser, JSONParser]
    filterset_class = AttachmentFilter
    search_fields = ("original_name",)
    ordering_fields = ("created_at", "size", "original_name")
    ordering = ("-created_at",)
    list_serializer_class = AttachmentDetailResponseSerializer
    detail_serializer_class = AttachmentDetailResponseSerializer
    create_serializer_class = AttachmentUploadValidateSerializer
    http_method_names = ["get", "post", "delete", "head", "options"]
    action_permissions = {
        "list": permission_rule(AttachmentPermission.FILE_READ),
        "retrieve": permission_rule(AttachmentPermission.FILE_READ),
        "create": permission_rule(AttachmentPermission.FILE_CREATE),
        "destroy": permission_rule(AttachmentPermission.FILE_DELETE),
    }
