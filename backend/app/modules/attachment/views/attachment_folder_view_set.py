"""CRUD thư mục logic của người dùng."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.modules.attachment.filters.attachment_folder_filter import AttachmentFolderFilter
from app.modules.attachment.models.attachment_folder import AttachmentFolder
from app.modules.attachment.permissions.attachment_folder_permission import (
    AttachmentFolderPermission as P,
)
from app.modules.attachment.serializers.responses.attachment_folder_response_serializer import (
    AttachmentFolderResponseSerializer,
)
from app.modules.attachment.serializers.validates.attachment_folder_update_validate_serializer import (
    AttachmentFolderUpdateValidateSerializer,
)
from app.modules.attachment.serializers.validates.attachment_folder_validate_serializer import (
    AttachmentFolderValidateSerializer,
)
from app.modules.attachment.services.attachment_folder_service import AttachmentFolderService
from app.modules.iam.types.permission_rule import permission_rule


class AttachmentFolderViewSet(CoreModelViewSet[AttachmentFolder]):
    """Nhóm riêng theo owner; không cần staff để dùng API khi đã có quyền IAM."""

    service_class = AttachmentFolderService
    filterset_class = AttachmentFolderFilter
    search_fields = ("name",)
    ordering_fields = ("created_at", "name")
    ordering = ("-created_at", "-pk")
    list_serializer_class = AttachmentFolderResponseSerializer
    detail_serializer_class = AttachmentFolderResponseSerializer
    create_serializer_class = AttachmentFolderValidateSerializer
    update_serializer_class = AttachmentFolderUpdateValidateSerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    action_permissions = {
        "list": permission_rule(P.FOLDER_READ),
        "retrieve": permission_rule(P.FOLDER_READ),
        "create": permission_rule(P.FOLDER_CREATE),
        "partial_update": permission_rule(P.FOLDER_UPDATE),
        "destroy": permission_rule(P.FOLDER_DELETE),
    }
