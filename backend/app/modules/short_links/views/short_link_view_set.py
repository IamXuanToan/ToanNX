"""CRUD liên kết rút gọn."""

from app.modules.iam.types.permission_rule import permission_rule
from app.modules.iam.views.owned_model_view_set import OwnedModelViewSet
from app.modules.short_links.filters.short_link_filter import ShortLinkFilter
from app.modules.short_links.models.short_link import ShortLink
from app.modules.short_links.permissions.short_links_permission import ShortLinksPermission
from app.modules.short_links.serializers.responses.short_link_detail_response_serializer import (
    ShortLinkDetailResponseSerializer,
)
from app.modules.short_links.serializers.validates.short_link_create_validate_serializer import (
    ShortLinkCreateValidateSerializer,
)
from app.modules.short_links.serializers.validates.short_link_update_validate_serializer import (
    ShortLinkUpdateValidateSerializer,
)
from app.modules.short_links.services.short_link_service import ShortLinkService


class ShortLinkViewSet(OwnedModelViewSet[ShortLink]):
    """CRUD của chủ sở hữu hoặc người có manage_all."""

    service_class = ShortLinkService
    filterset_class = ShortLinkFilter
    search_fields = ("name", "slug", "description")
    ordering_fields = ("name", "slug", "created_at", "expires_at")
    ordering = ("-created_at",)
    list_serializer_class = ShortLinkDetailResponseSerializer
    detail_serializer_class = ShortLinkDetailResponseSerializer
    create_serializer_class = ShortLinkCreateValidateSerializer
    update_serializer_class = ShortLinkUpdateValidateSerializer
    action_permissions = {
        "list": permission_rule(ShortLinksPermission.READ),
        "retrieve": permission_rule(ShortLinksPermission.READ),
        "create": permission_rule(ShortLinksPermission.CREATE),
        "partial_update": permission_rule(ShortLinksPermission.UPDATE),
        "destroy": permission_rule(ShortLinksPermission.DELETE),
    }
