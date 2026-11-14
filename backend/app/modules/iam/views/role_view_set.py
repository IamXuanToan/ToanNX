"""API vai trò: /iam/roles và /iam/roles/{id}.

GET    /iam/roles?search=&is_active=&is_system=&ordering=&page=&page_size=
POST   /iam/roles
GET    /iam/roles/{id}
PATCH  /iam/roles/{id}
"""

from app.modules.iam.filters.role_filter import RoleFilter
from app.modules.iam.models.role import Role
from app.modules.iam.permissions.iam_permission import IamPermission
from app.modules.iam.serializers.responses.role_detail_response_serializer import (
    RoleDetailResponseSerializer,
)
from app.modules.iam.serializers.responses.role_list_response_serializer import (
    RoleListResponseSerializer,
)
from app.modules.iam.serializers.validates.role_create_validate_serializer import (
    RoleCreateValidateSerializer,
)
from app.modules.iam.serializers.validates.role_update_validate_serializer import (
    RoleUpdateValidateSerializer,
)
from app.modules.iam.services.role_service import RoleService
from app.modules.iam.types.permission_rule import permission_rule
from app.modules.iam.views.admin_model_view_set import AdminModelViewSet


class RoleViewSet(AdminModelViewSet[Role]):
    """CRUD vai trò (không có xóa: tắt vai trò bằng `is_active=false`)."""

    service_class = RoleService
    filterset_class = RoleFilter
    search_fields = ("code", "name", "description")
    ordering_fields = ("code", "name", "created_at")
    ordering = ("code",)
    list_serializer_class = RoleListResponseSerializer
    detail_serializer_class = RoleDetailResponseSerializer
    create_serializer_class = RoleCreateValidateSerializer
    update_serializer_class = RoleUpdateValidateSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]
    action_permissions = {
        "list": permission_rule(IamPermission.ROLE_READ),
        "retrieve": permission_rule(IamPermission.ROLE_READ),
        "create": permission_rule(IamPermission.ROLE_CREATE),
        "partial_update": permission_rule(IamPermission.ROLE_UPDATE),
    }
