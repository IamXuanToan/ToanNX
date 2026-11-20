"""ViewSet quản lý tác giả tiểu thuyết."""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.novel.models.author import Author
from app.novel.permissions.author_permission import AuthorPermission as P
from app.novel.serializers.responses.author_summary_response_serializer import (
    AuthorSummaryResponseSerializer,
)
from app.novel.serializers.validates.author_update_validate_serializer import (
    AuthorUpdateValidateSerializer,
)
from app.novel.serializers.validates.author_validate_serializer import (
    AuthorValidateSerializer,
)
from app.novel.services.author_service import AuthorService
from app.system.types.permission_rule import permission_rule


class AuthorViewSet(CoreModelViewSet[Author]):
    """CRUD tác giả tiểu thuyết: danh sách, chi tiết, tạo mới, sửa, xóa và xóa hàng loạt."""

    service_class = AuthorService
    service: AuthorService
    search_fields = ("name", "slug")
    ordering_fields = ("name", "created_at")
    ordering = ("name",)
    list_serializer_class = AuthorSummaryResponseSerializer
    detail_serializer_class = AuthorSummaryResponseSerializer
    create_serializer_class = AuthorValidateSerializer
    update_serializer_class = AuthorUpdateValidateSerializer
    bulk_delete_enabled = True
    action_permissions = {
        "list": permission_rule(P.READ),
        "retrieve": permission_rule(P.READ),
        "create": permission_rule(P.CREATE),
        "partial_update": permission_rule(P.UPDATE),
        "destroy": permission_rule(P.DELETE),
        "bulk_delete": permission_rule(P.DELETE),
    }
