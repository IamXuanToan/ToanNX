"""CRUD đường dẫn giữa.

GET    /custom_pages/paths?search=&is_active=&ordering=&page=&page_size=
POST   /custom_pages/paths
GET    /custom_pages/paths/{id}
PATCH  /custom_pages/paths/{id}
DELETE /custom_pages/paths/{id}           (còn trang → 409 CUSTOM_PAGES_PATH_IN_USE)
GET    /custom_pages/paths/{id}/history
"""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.modules.custom_pages.filters.page_path_filter import PagePathFilter
from app.modules.custom_pages.models.page_path import PagePath
from app.modules.custom_pages.permissions.custom_pages_permission import CustomPagesPermission as P
from app.modules.custom_pages.serializers.responses.page_path_response_serializer import (
    PagePathResponseSerializer,
)
from app.modules.custom_pages.serializers.validates.page_path_create_validate_serializer import (
    PagePathCreateValidateSerializer,
)
from app.modules.custom_pages.serializers.validates.page_path_update_validate_serializer import (
    PagePathUpdateValidateSerializer,
)
from app.modules.custom_pages.services.page_path_service import PagePathService
from app.modules.iam.types.permission_rule import permission_rule


class PagePathViewSet(CoreModelViewSet[PagePath]):
    """Tài nguyên chung (không owner): chỉ theo quyền `custom_pages.path.*`."""

    service_class = PagePathService
    filterset_class = PagePathFilter
    search_fields = ("segment", "name")
    ordering_fields = ("position", "segment", "name", "created_at", "page_count")
    ordering = ("position", "segment")
    list_serializer_class = PagePathResponseSerializer
    detail_serializer_class = PagePathResponseSerializer
    create_serializer_class = PagePathCreateValidateSerializer
    update_serializer_class = PagePathUpdateValidateSerializer
    history_enabled = True
    action_rate_limits = {"create": "custom_pages.path.create"}
    action_permissions = {
        "list": permission_rule(P.PATH_READ),
        "retrieve": permission_rule(P.PATH_READ),
        "create": permission_rule(P.PATH_CREATE),
        "partial_update": permission_rule(P.PATH_UPDATE),
        "destroy": permission_rule(P.PATH_DELETE),
        "history": permission_rule(P.PATH_READ),
    }
