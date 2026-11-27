"""API cấu hình hệ thống: /system/settings và /system/settings/{id}.

GET    /system/settings?search=&category=&is_public=&ordering=&page=&page_size=
POST   /system/settings
GET    /system/settings/{id}
PATCH  /system/settings/{id}
DELETE /system/settings/{id}   (xóa mềm)
GET    /system/settings/{id}/history
"""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.filters.setting_filter import SettingFilter
from app.system.models.setting import Setting
from app.system.permissions.setting_permission import SettingPermission
from app.system.serializers.responses.setting_response_serializer import (
    SettingResponseSerializer,
)
from app.system.serializers.validates.setting_create_validate_serializer import (
    SettingCreateValidateSerializer,
)
from app.system.serializers.validates.setting_update_validate_serializer import (
    SettingUpdateValidateSerializer,
)
from app.system.services.setting_service import SettingService
from app.system.types.permission_rule import permission_rule


class SettingViewSet(CoreModelViewSet[Setting]):
    """CRUD cấu hình hệ thống dạng key-value."""

    service_class = SettingService
    filterset_class = SettingFilter
    search_fields = ("key", "description", "category")
    ordering_fields = ("key", "category", "created_at", "updated_at", "is_public")
    ordering = ("category", "key")
    list_serializer_class = SettingResponseSerializer
    detail_serializer_class = SettingResponseSerializer
    create_serializer_class = SettingCreateValidateSerializer
    update_serializer_class = SettingUpdateValidateSerializer
    history_enabled = True
    bulk_delete_enabled = True
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    action_permissions = {
        "list": permission_rule(SettingPermission.SETTING_READ),
        "retrieve": permission_rule(SettingPermission.SETTING_READ),
        "create": permission_rule(SettingPermission.SETTING_CREATE),
        "partial_update": permission_rule(SettingPermission.SETTING_UPDATE),
        "destroy": permission_rule(SettingPermission.SETTING_DELETE),
        "bulk_delete": permission_rule(SettingPermission.SETTING_DELETE),
        "history": permission_rule(SettingPermission.SETTING_READ),
    }
