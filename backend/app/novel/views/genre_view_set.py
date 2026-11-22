"""ViewSet quản lý thể loại tiểu thuyết."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.novel.models.genre import Genre
from app.novel.permissions.genre_permission import GenrePermission as P
from app.novel.serializers.responses.genre_summary_response_serializer import (
    GenreSummaryResponseSerializer,
)
from app.novel.serializers.validates.genre_update_validate_serializer import (
    GenreUpdateValidateSerializer,
)
from app.novel.serializers.validates.genre_validate_serializer import (
    GenreValidateSerializer,
)
from app.novel.services.genre_service import GenreService
from app.system.types.permission_rule import permission_rule


class GenreViewSet(CoreModelViewSet[Genre]):
    """CRUD thể loại tiểu thuyết: danh sách, chi tiết, tạo mới, sửa, xóa và xóa hàng loạt."""

    service_class = GenreService
    service: GenreService
    search_fields = ("name", "slug")
    ordering_fields = ("name", "created_at")
    ordering = ("name",)
    list_serializer_class = GenreSummaryResponseSerializer
    detail_serializer_class = GenreSummaryResponseSerializer
    create_serializer_class = GenreValidateSerializer
    update_serializer_class = GenreUpdateValidateSerializer
    bulk_delete_enabled = True
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_delete": permission_rule(P.DELETE),
    }
