"""Thông báo hệ thống: danh sách, gửi (tạo), thu hồi (xóa)."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.models.system_announcement import SystemAnnouncement
from app.system.permissions.announcement_permission import AnnouncementPermission as P
from app.system.serializers.responses.system_announcement_response_serializer import (
    SystemAnnouncementResponseSerializer,
)
from app.system.serializers.validates.system_announcement_validate_serializer import (
    SystemAnnouncementValidateSerializer,
)
from app.system.services.system_announcement_service import SystemAnnouncementService
from app.system.types.permission_rule import permission_rule


class SystemAnnouncementViewSet(CoreModelViewSet[SystemAnnouncement]):
    """Không sửa sau khi gửi; muốn đổi thì thu hồi rồi gửi lại."""

    service_class = SystemAnnouncementService
    search_fields = ("title",)
    ordering = ("-created_at",)
    ordering_fields = ("created_at",)
    list_serializer_class = SystemAnnouncementResponseSerializer
    detail_serializer_class = SystemAnnouncementResponseSerializer
    create_serializer_class = SystemAnnouncementValidateSerializer
    bulk_delete_enabled = True
    http_method_names = ["get", "post", "delete", "head", "options"]
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_delete": permission_rule(P.DELETE),
    }
