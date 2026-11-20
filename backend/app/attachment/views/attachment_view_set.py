"""API file đính kèm.

GET    /attachments?search=&content_type=&ordering=&page=&page_size=
POST   /attachments              (multipart/form-data, field `file`)
GET    /attachments/{id}
DELETE /attachments/{id}         (xóa mềm)
POST   /attachments/bulk-update (`ids`, `folder_id`) · /attachments/bulk-delete (`ids`)
GET    /attachments/{id}/history
"""

from rest_framework.parsers import JSONParser, MultiPartParser

from app.attachment.filters.attachment_filter import AttachmentFilter
from app.attachment.models.attachment import Attachment
from app.attachment.permissions.attachment_permission import AttachmentPermission
from app.attachment.serializers.responses.attachment_detail_response_serializer import (
    AttachmentDetailResponseSerializer,
)
from app.attachment.serializers.validates.attachment_bulk_update_validate_serializer import (
    AttachmentBulkUpdateValidateSerializer,
)
from app.attachment.serializers.validates.attachment_update_validate_serializer import (
    AttachmentUpdateValidateSerializer,
)
from app.attachment.serializers.validates.attachment_upload_validate_serializer import (
    AttachmentUploadValidateSerializer,
)
from app.attachment.services.attachment_service import AttachmentService
from app.core.views.core_model_view_set import CoreModelViewSet
from app.iam.types.permission_rule import permission_rule


class AttachmentViewSet(CoreModelViewSet[Attachment]):
    """Upload, xem, xóa mềm file."""

    service_class = AttachmentService
    parser_classes = [MultiPartParser, JSONParser]
    filterset_class = AttachmentFilter
    search_fields = ("original_name",)
    ordering_fields = ("created_at", "size", "original_name")
    ordering = ("-created_at", "-pk")
    list_serializer_class = AttachmentDetailResponseSerializer
    detail_serializer_class = AttachmentDetailResponseSerializer
    create_serializer_class = AttachmentUploadValidateSerializer
    update_serializer_class = AttachmentUpdateValidateSerializer
    bulk_update_serializer_class = AttachmentBulkUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    action_permissions = {
        "list": permission_rule(AttachmentPermission.FILE_READ),
        "retrieve": permission_rule(AttachmentPermission.FILE_READ),
        "create": permission_rule(AttachmentPermission.FILE_CREATE),
        "destroy": permission_rule(AttachmentPermission.FILE_DELETE),
        "partial_update": permission_rule(AttachmentPermission.FILE_UPDATE),
        "bulk_update": permission_rule(AttachmentPermission.FILE_UPDATE),
        "bulk_delete": permission_rule(AttachmentPermission.FILE_DELETE),
        "history": permission_rule(AttachmentPermission.FILE_READ),
    }
