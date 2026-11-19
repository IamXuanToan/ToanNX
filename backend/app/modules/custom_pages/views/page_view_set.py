"""CRUD trang tùy chỉnh.

GET    /custom_pages/pages?search=&status=&path=&owner=&ordering=&page=&page_size=
POST   /custom_pages/pages                     (`path_id`, `title`, `slug?`, `content?` | `template?`)
GET    /custom_pages/pages/{id}
PATCH  /custom_pages/pages/{id}                (sửa `content` phải gửi `content_version`, lệch → 409)
DELETE /custom_pages/pages/{id}                (xóa mềm)
POST   /custom_pages/pages/bulk-update         (`ids`, `status`)
POST   /custom_pages/pages/bulk-delete         (`ids`)
POST   /custom_pages/pages/{id}/duplicate      (bản nháp của người thực hiện)
GET    /custom_pages/pages/{id}/history
"""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_model_view_set import CoreModelViewSet
from app.modules.custom_pages.filters.page_filter import PageFilter
from app.modules.custom_pages.models.page import Page
from app.modules.custom_pages.permissions.page_permission import PagePermission as P
from app.modules.custom_pages.serializers.responses.page_detail_response_serializer import (
    PageDetailResponseSerializer,
)
from app.modules.custom_pages.serializers.responses.page_list_response_serializer import (
    PageListResponseSerializer,
)
from app.modules.custom_pages.serializers.validates.page_bulk_update_validate_serializer import (
    PageBulkUpdateValidateSerializer,
)
from app.modules.custom_pages.serializers.validates.page_create_validate_serializer import (
    PageCreateValidateSerializer,
)
from app.modules.custom_pages.serializers.validates.page_update_validate_serializer import (
    PageUpdateValidateSerializer,
)
from app.modules.custom_pages.services.page_service import PageService
from app.modules.iam.types.permission_rule import permission_rule


class PageViewSet(CoreModelViewSet[Page]):
    """Trang của owner hoặc mọi người khi có `manage_all`."""

    service_class = PageService
    service: PageService
    filterset_class = PageFilter
    search_fields = ("title", "slug", "description")
    ordering_fields = ("title", "slug", "status", "created_at", "updated_at", "published_at")
    ordering = ("-created_at", "-pk")
    list_serializer_class = PageListResponseSerializer
    detail_serializer_class = PageDetailResponseSerializer
    create_serializer_class = PageCreateValidateSerializer
    update_serializer_class = PageUpdateValidateSerializer
    bulk_update_serializer_class = PageBulkUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_rate_limits = {"create": "custom_pages.create", "duplicate": "custom_pages.create"}
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_update": permission_rule(P.UPDATE),
        "bulk_delete": permission_rule(P.DELETE),
        "duplicate": permission_rule(P.CREATE, P.READ, require_all=True),
        "history": permission_rule(P.READ),
    }

    @extend_schema(request=None, responses=PageDetailResponseSerializer)
    @action(detail=True, methods=["post"])
    def duplicate(self, request: Request, pk: Any = None) -> CoreResponse:
        """Nhân bản trang thành bản nháp của người thực hiện."""
        copy = self.service.duplicate(self.get_actor(request), pk)
        return CoreResponse(self.serialize_detail(self.get_object_for_actor(copy.pk)), status=201)
