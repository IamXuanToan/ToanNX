"""ViewSet quản lý chương truyện."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.iam.types.permission_rule import permission_rule
from app.novel.filters.chapter_filter import ChapterFilter
from app.novel.models.chapter import Chapter
from app.novel.permissions.chapter_permission import ChapterPermission as P
from app.novel.serializers.responses.chapter_detail_response_serializer import (
    ChapterDetailResponseSerializer,
)
from app.novel.serializers.responses.chapter_list_response_serializer import (
    ChapterListResponseSerializer,
)
from app.novel.serializers.validates.chapter_create_validate_serializer import (
    ChapterCreateValidateSerializer,
)
from app.novel.serializers.validates.chapter_update_validate_serializer import (
    ChapterUpdateValidateSerializer,
)
from app.novel.services.chapter_service import ChapterService


class ChapterViewSet(CoreModelViewSet[Chapter]):
    """CRUD chương truyện: danh sách, chi tiết, tạo mới, sửa, xóa và xóa hàng loạt."""

    service_class = ChapterService
    service: ChapterService
    filterset_class = ChapterFilter
    search_fields = ("title", "slug")
    ordering_fields = ("chapter_number", "created_at", "views_count")
    ordering = ("chapter_number", "created_at")
    list_serializer_class = ChapterListResponseSerializer
    detail_serializer_class = ChapterDetailResponseSerializer
    create_serializer_class = ChapterCreateValidateSerializer
    update_serializer_class = ChapterUpdateValidateSerializer
    bulk_delete_enabled = True
    action_rate_limits = {"create": "novel.create"}
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_delete": permission_rule(P.DELETE),
    }
