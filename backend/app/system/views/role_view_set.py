"""API vai trò: /iam/roles và /iam/roles/{id}.

GET    /iam/roles?search=&is_active=&is_system=&ordering=&page=&page_size=
POST   /iam/roles
GET    /iam/roles/{id}
PATCH  /iam/roles/{id}
DELETE /iam/roles/{id}       (xóa mềm)
POST   /iam/roles/bulk-update · /iam/roles/bulk-delete
GET    /iam/roles/{id}/history
"""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.filters.role_filter import RoleFilter
from app.system.models.role import Role
from app.system.permissions.iam_permission import IamPermission
from app.system.serializers.responses.role_detail_response_serializer import (
    RoleDetailResponseSerializer,
)
from app.system.serializers.responses.role_list_response_serializer import (
    RoleListResponseSerializer,
)
from app.system.serializers.validates.role_bulk_update_validate_serializer import (
    RoleBulkUpdateValidateSerializer,
)
from app.system.serializers.validates.role_create_validate_serializer import (
    RoleCreateValidateSerializer,
)
from app.system.serializers.validates.role_update_validate_serializer import (
    RoleUpdateValidateSerializer,
)
from app.system.services.role_service import RoleService
from app.system.types.permission_rule import permission_rule


class RoleViewSet(CoreModelViewSet[Role]):
    """CRUD vai trò, bao gồm xóa mềm."""

    service_class = RoleService
    filterset_class = RoleFilter
    search_fields = ("code", "name", "description")
    ordering_fields = ("code", "name", "created_at", "is_active", "permission_count", "user_count")
    ordering = ("-created_at", "-pk")
    list_serializer_class = RoleListResponseSerializer
    detail_serializer_class = RoleDetailResponseSerializer
    create_serializer_class = RoleCreateValidateSerializer
    update_serializer_class = RoleUpdateValidateSerializer
    bulk_update_serializer_class = RoleBulkUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    action_permissions = {
        "list": permission_rule(IamPermission.ROLE_READ),
        "retrieve": permission_rule(IamPermission.ROLE_READ),
        "create": permission_rule(IamPermission.ROLE_CREATE),
        "partial_update": permission_rule(IamPermission.ROLE_UPDATE),
        "destroy": permission_rule(IamPermission.ROLE_DELETE),
        "bulk_update": permission_rule(IamPermission.ROLE_UPDATE),
        "bulk_delete": permission_rule(IamPermission.ROLE_DELETE),
        "history": permission_rule(IamPermission.ROLE_READ),
    }
