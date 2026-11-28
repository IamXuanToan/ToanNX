"""ViewSet quản trị danh mục Ngôn ngữ (`/api/v1/system/languages`)."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.filters.language_filter import LanguageFilter
from app.system.permissions.language_permission import LanguagePermission as P
from app.system.serializers.responses.language_response_serializer import LanguageResponseSerializer
from app.system.serializers.validates.language_bulk_update_validate_serializer import (
    LanguageBulkUpdateValidateSerializer,
)
from app.system.serializers.validates.language_create_validate_serializer import (
    LanguageCreateValidateSerializer,
)
from app.system.serializers.validates.language_update_validate_serializer import (
    LanguageUpdateValidateSerializer,
)
from app.system.services.language_service import LanguageService
from app.system.types.permission_rule import permission_rule


class LanguageViewSet(CoreModelViewSet):
    """CRUD danh mục ngôn ngữ dùng chung toàn hệ thống."""

    service_class = LanguageService
    filterset_class = LanguageFilter
    search_fields = ("code", "name", "native_name")
    ordering_fields = ("sort_order", "code", "name", "created_at", "updated_at")
    ordering = ("sort_order", "code")
    list_serializer_class = LanguageResponseSerializer
    detail_serializer_class = LanguageResponseSerializer
    create_serializer_class = LanguageCreateValidateSerializer
    update_serializer_class = LanguageUpdateValidateSerializer
    bulk_update_serializer_class = LanguageBulkUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_update": permission_rule(P.UPDATE),
        "bulk_delete": permission_rule(P.DELETE),
        "history": permission_rule(P.READ),
    }
