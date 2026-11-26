"""CRUD đường dẫn giữa.

GET    /utilities/page-paths?search=&is_active=&ordering=&page=&page_size=
POST   /utilities/page-paths
GET    /utilities/page-paths/{id}
PATCH  /utilities/page-paths/{id}
DELETE /utilities/page-paths/{id}           (còn trang → 409 UTILITIES_PAGE_PATH_IN_USE)
GET    /utilities/page-paths/{id}/history
"""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.types.permission_rule import permission_rule
from app.utilities.constants.utilities_rate_limit_key import UtilitiesRateLimitKey
from app.utilities.filters.page_path_filter import PagePathFilter
from app.utilities.models.page_path import PagePath
from app.utilities.permissions.page_path_permission import PagePathPermission as P
from app.utilities.serializers.responses.page_path_response_serializer import (
    PagePathResponseSerializer,
)
from app.utilities.serializers.validates.page_path_bulk_update_validate_serializer import (
    PagePathBulkUpdateValidateSerializer,
)
from app.utilities.serializers.validates.page_path_create_validate_serializer import (
    PagePathCreateValidateSerializer,
)
from app.utilities.serializers.validates.page_path_update_validate_serializer import (
    PagePathUpdateValidateSerializer,
)
from app.utilities.services.page_path_service import PagePathService


class PagePathViewSet(CoreModelViewSet[PagePath]):
    """Tài nguyên chung (không owner): chỉ theo quyền `utilities.page_path.*`."""

    service_class = PagePathService
    filterset_class = PagePathFilter
    search_fields = ("segment", "name")
    ordering_fields = ("position", "segment", "name", "created_at", "page_count")
    ordering = ("position", "segment")
    list_serializer_class = PagePathResponseSerializer
    detail_serializer_class = PagePathResponseSerializer
    create_serializer_class = PagePathCreateValidateSerializer
    update_serializer_class = PagePathUpdateValidateSerializer
    bulk_update_serializer_class = PagePathBulkUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_rate_limits = {"create": UtilitiesRateLimitKey.PAGE_PATH_CREATE}
    action_permissions = {
        "list": permission_rule(P.PATH_READ),
        "retrieve": permission_rule(P.PATH_READ),
        "create": permission_rule(P.PATH_CREATE),
        "partial_update": permission_rule(P.PATH_UPDATE),
        "destroy": permission_rule(P.PATH_DELETE),
        "bulk_update": permission_rule(P.PATH_UPDATE),
        "bulk_delete": permission_rule(P.PATH_DELETE),
        "history": permission_rule(P.PATH_READ),
    }
