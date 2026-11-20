"""CRUD liên kết rút gọn.

GET    /utilities/short-links?search=&status=ACTIVE,EXPIRED&owner=&ordering=&page=&page_size=
POST   /utilities/short-links
GET    /utilities/short-links/{id}
PATCH  /utilities/short-links/{id}
DELETE /utilities/short-links/{id}            (xóa mềm)
POST   /utilities/short-links/bulk-update     (`ids`, `status`)
POST   /utilities/short-links/bulk-delete     (`ids`)
GET    /utilities/short-links/{id}/history
"""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.iam.types.permission_rule import permission_rule
from app.utilities.filters.short_link_filter import ShortLinkFilter
from app.utilities.models.short_link import ShortLink
from app.utilities.permissions.short_link_permission import ShortLinkPermission as P
from app.utilities.serializers.responses.short_link_detail_response_serializer import (
    ShortLinkDetailResponseSerializer,
)
from app.utilities.serializers.responses.short_link_list_response_serializer import (
    ShortLinkListResponseSerializer,
)
from app.utilities.serializers.validates.short_link_bulk_update_validate_serializer import (
    ShortLinkBulkUpdateValidateSerializer,
)
from app.utilities.serializers.validates.short_link_create_validate_serializer import (
    ShortLinkCreateValidateSerializer,
)
from app.utilities.serializers.validates.short_link_update_validate_serializer import (
    ShortLinkUpdateValidateSerializer,
)
from app.utilities.services.short_link_service import ShortLinkService


class ShortLinkViewSet(CoreModelViewSet[ShortLink]):
    """Link của chính mình; có `manage_all` thì thấy của mọi người (vẫn cần quyền action)."""

    service_class = ShortLinkService
    filterset_class = ShortLinkFilter
    search_fields = ("name", "slug", "destination_url")
    ordering_fields = ("name", "slug", "created_at", "updated_at", "expires_at", "status")
    ordering = ("-created_at", "-pk")
    list_serializer_class = ShortLinkListResponseSerializer
    detail_serializer_class = ShortLinkDetailResponseSerializer
    create_serializer_class = ShortLinkCreateValidateSerializer
    update_serializer_class = ShortLinkUpdateValidateSerializer
    bulk_update_serializer_class = ShortLinkBulkUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_rate_limits = {"create": "utilities.short_link.create"}
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
