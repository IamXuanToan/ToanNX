"""API người dùng: /account/users và /account/users/{id}.

GET    /account/users?search=&is_active=&is_staff=&ordering=&page=&page_size=
POST   /account/users
GET    /account/users/{id}
PATCH  /account/users/{id}
DELETE /account/users/{id}   (xóa mềm)
POST   /account/users/bulk-update · /account/users/bulk-delete
GET    /account/users/{id}/history
"""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.modules.account.filters.user_filter import UserFilter
from app.modules.account.models.user import User
from app.modules.account.permissions.account_permission import AccountPermission
from app.modules.account.serializers.responses.user_detail_response_serializer import (
    UserDetailResponseSerializer,
)
from app.modules.account.serializers.responses.user_list_response_serializer import (
    UserListResponseSerializer,
)
from app.modules.account.serializers.validates.user_bulk_update_validate_serializer import (
    UserBulkUpdateValidateSerializer,
)
from app.modules.account.serializers.validates.user_create_validate_serializer import (
    UserCreateValidateSerializer,
)
from app.modules.account.serializers.validates.user_update_validate_serializer import (
    UserUpdateValidateSerializer,
)
from app.modules.account.services.user_service import UserService
from app.modules.iam.types.permission_rule import permission_rule


class UserViewSet(CoreModelViewSet[User]):
    """CRUD người dùng (xóa là xóa mềm)."""

    service_class = UserService
    filterset_class = UserFilter
    search_fields = ("email", "username", "first_name", "last_name")
    ordering_fields = ("created_at", "email", "last_login", "last_seen_at", "is_active", "is_superuser")
    ordering = ("-created_at",)
    list_serializer_class = UserListResponseSerializer
    detail_serializer_class = UserDetailResponseSerializer
    create_serializer_class = UserCreateValidateSerializer
    update_serializer_class = UserUpdateValidateSerializer
    bulk_update_serializer_class = UserBulkUpdateValidateSerializer
    bulk_delete_enabled = True
    history_enabled = True
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    action_permissions = {
        "list": permission_rule(AccountPermission.USER_READ),
        "retrieve": permission_rule(AccountPermission.USER_READ),
        "create": permission_rule(AccountPermission.USER_CREATE),
        "partial_update": permission_rule(AccountPermission.USER_UPDATE),
        "destroy": permission_rule(AccountPermission.USER_DELETE),
        "bulk_update": permission_rule(AccountPermission.USER_UPDATE),
        "bulk_delete": permission_rule(AccountPermission.USER_DELETE),
        "history": permission_rule(AccountPermission.USER_READ),
    }
