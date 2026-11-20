"""ViewSet quản lý thẻ / hashtag tiểu thuyết."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.novel.models.tag import Tag
from app.novel.permissions.tag_permission import TagPermission as P
from app.novel.serializers.responses.tag_summary_response_serializer import (
    TagSummaryResponseSerializer,
)
from app.novel.serializers.validates.tag_update_validate_serializer import (
    TagUpdateValidateSerializer,
)
from app.novel.serializers.validates.tag_validate_serializer import (
    TagValidateSerializer,
)
from app.novel.services.tag_service import TagService
from app.system.types.permission_rule import permission_rule


class TagViewSet(CoreModelViewSet[Tag]):
    """CRUD thẻ / hashtag tiểu thuyết: danh sách, chi tiết, tạo mới, sửa, xóa và xóa hàng loạt."""

    service_class = TagService
    service: TagService
    search_fields = ("name", "slug")
    ordering_fields = ("name", "created_at")
    ordering = ("name",)
    list_serializer_class = TagSummaryResponseSerializer
    detail_serializer_class = TagSummaryResponseSerializer
    create_serializer_class = TagValidateSerializer
    update_serializer_class = TagUpdateValidateSerializer
    bulk_delete_enabled = True
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_delete": permission_rule(P.DELETE),
    }
