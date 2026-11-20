"""ViewSet quản lý tiểu thuyết."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.iam.types.permission_rule import permission_rule
from app.novel.filters.novel_filter import NovelFilter
from app.novel.models.novel import Novel
from app.novel.permissions.novel_permission import NovelPermission as P
from app.novel.serializers.responses.novel_detail_response_serializer import (
    NovelDetailResponseSerializer,
)
from app.novel.serializers.responses.novel_list_response_serializer import (
    NovelListResponseSerializer,
)
from app.novel.serializers.validates.novel_bulk_update_validate_serializer import (
    NovelBulkUpdateValidateSerializer,
)
from app.novel.serializers.validates.novel_create_validate_serializer import (
    NovelCreateValidateSerializer,
)
from app.novel.serializers.validates.novel_update_validate_serializer import (
    NovelUpdateValidateSerializer,
)
from app.novel.services.novel_service import NovelService


class NovelViewSet(CoreModelViewSet[Novel]):
    """CRUD tiểu thuyết: danh sách, chi tiết, tạo mới, sửa, xóa, xóa hàng loạt và lịch sử thay đổi."""

    service_class = NovelService
    service: NovelService
    filterset_class = NovelFilter
    search_fields = ("title", "slug", "original_title", "author__name")
    ordering_fields = (
        "title",
        "views_count",
        "favorites_count",
        "created_at",
        "updated_at",
    )
    ordering = ("-created_at", "-pk")
    list_serializer_class = NovelListResponseSerializer
    detail_serializer_class = NovelDetailResponseSerializer
    create_serializer_class = NovelCreateValidateSerializer
    update_serializer_class = NovelUpdateValidateSerializer
    bulk_update_serializer_class = NovelBulkUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    action_rate_limits = {"create": "novel.create"}
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
