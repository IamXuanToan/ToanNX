"""CRUD trang tùy chỉnh."""

from app.modules.custom_pages.filters.page_filter import PageFilter
from app.modules.custom_pages.models.page import Page
from app.modules.custom_pages.permissions.custom_pages_permission import CustomPagesPermission
from app.modules.custom_pages.serializers.responses.page_detail_response_serializer import (
    PageDetailResponseSerializer,
)
from app.modules.custom_pages.serializers.responses.page_list_response_serializer import (
    PageListResponseSerializer,
)
from app.modules.custom_pages.serializers.validates.page_create_validate_serializer import (
    PageCreateValidateSerializer,
)
from app.modules.custom_pages.serializers.validates.page_update_validate_serializer import (
    PageUpdateValidateSerializer,
)
from app.modules.custom_pages.services.page_service import PageService
from app.modules.iam.types.permission_rule import permission_rule
from app.modules.iam.views.owned_model_view_set import OwnedModelViewSet


class PageViewSet(OwnedModelViewSet[Page]):
    """CRUD trang của owner hoặc người có manage_all."""

    service_class = PageService
    filterset_class = PageFilter
    search_fields = ("title", "slug", "description")
    ordering_fields = ("title", "slug", "created_at", "updated_at")
    ordering = ("-created_at",)
    list_serializer_class = PageListResponseSerializer
    detail_serializer_class = PageDetailResponseSerializer
    create_serializer_class = PageCreateValidateSerializer
    update_serializer_class = PageUpdateValidateSerializer
    action_permissions = {
        "list": permission_rule(CustomPagesPermission.READ),
        "retrieve": permission_rule(CustomPagesPermission.READ),
        "create": permission_rule(CustomPagesPermission.CREATE),
        "partial_update": permission_rule(CustomPagesPermission.UPDATE),
        "destroy": permission_rule(CustomPagesPermission.DELETE),
    }
