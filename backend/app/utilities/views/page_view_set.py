"""CRUD trang tùy chỉnh.

GET    /utilities/pages?search=&status=&path=&owner=&ordering=&page=&page_size=
POST   /utilities/pages                     (`path_id`, `title`, `slug?`, `content?` | `template?`)
GET    /utilities/pages/{id}
PATCH  /utilities/pages/{id}                (sửa `content` phải gửi `content_version`, lệch → 409)
DELETE /utilities/pages/{id}                (xóa mềm)
POST   /utilities/pages/bulk-update         (`ids`, `status`)
POST   /utilities/pages/bulk-delete         (`ids`)
POST   /utilities/pages/{id}/duplicate      (bản nháp của người thực hiện)
GET    /utilities/pages/{id}/history
"""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.types.permission_rule import permission_rule
from app.utilities.constants.utilities_rate_limit_key import UtilitiesRateLimitKey
from app.utilities.filters.page_filter import PageFilter
from app.utilities.models.page import Page
from app.utilities.permissions.page_permission import PagePermission as P
from app.utilities.serializers.responses.page_detail_response_serializer import (
    PageDetailResponseSerializer,
)
from app.utilities.serializers.responses.page_list_response_serializer import (
    PageListResponseSerializer,
)
from app.utilities.serializers.responses.page_metadata_response_serializer import (
    PageMetadataResponseSerializer,
)
from app.utilities.serializers.validates.page_bulk_update_validate_serializer import (
    PageBulkUpdateValidateSerializer,
)
from app.utilities.serializers.validates.page_create_validate_serializer import (
    PageCreateValidateSerializer,
)
from app.utilities.serializers.validates.page_fetch_metadata_validate_serializer import (
    PageFetchMetadataValidateSerializer,
)
from app.utilities.serializers.validates.page_update_validate_serializer import (
    PageUpdateValidateSerializer,
)
from app.utilities.services.link_metadata_service import LinkMetadataService
from app.utilities.services.page_service import PageService


class PageViewSet(CoreModelViewSet[Page]):
    """Trang của owner hoặc mọi người khi có `manage_all`."""

    service_class = PageService
    service: PageService
    link_metadata_service: LinkMetadataService

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service theo đúng quy chuẩn kiến trúc."""
        super().__init__(**kwargs)
        self.link_metadata_service = LinkMetadataService()

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
    action_rate_limits = {
        "create": UtilitiesRateLimitKey.PAGE_CREATE,
        "duplicate": UtilitiesRateLimitKey.PAGE_CREATE,
        "fetch_metadata": UtilitiesRateLimitKey.PAGE_CREATE,
    }
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
        "fetch_metadata": permission_rule(P.CREATE, P.UPDATE),
    }

    @extend_schema(request=None, responses=PageDetailResponseSerializer)
    @action(detail=True, methods=["post"])
    def duplicate(self, request: Request, pk: Any = None) -> CoreResponse:
        """Nhân bản trang thành bản nháp của người thực hiện."""
        copy = self.service.duplicate(self.get_actor(request), pk)
        return CoreResponse(self.serialize_detail(self.get_object_for_actor(copy.pk)), status=201)

    @extend_schema(request=PageFetchMetadataValidateSerializer, responses=PageMetadataResponseSerializer)
    @action(detail=False, methods=["post"], url_path="fetch-metadata")
    def fetch_metadata(self, request: Request) -> CoreResponse:
        """Đọc thông tin metadata từ URL sản phẩm/liên kết (bảo vệ SSRF)."""
        serializer = PageFetchMetadataValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = self.link_metadata_service.fetch_metadata(serializer.validated_data["url"])
        return CoreResponse(PageMetadataResponseSerializer(data).data)
