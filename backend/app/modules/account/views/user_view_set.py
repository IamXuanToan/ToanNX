"""API người dùng: /account/users và /account/users/{id}.

GET    /account/users?search=&is_active=&is_staff=&ordering=&page=&page_size=
POST   /account/users
GET    /account/users/{id}
PATCH  /account/users/{id}
"""

from app.modules.account.filters.user_filter import UserFilter
from app.modules.account.models.user import User
from app.modules.account.permissions.account_permission import AccountPermission
from app.modules.account.serializers.responses.user_detail_response_serializer import (
    UserDetailResponseSerializer,
)
from app.modules.account.serializers.responses.user_list_response_serializer import (
    UserListResponseSerializer,
)
from app.modules.account.serializers.validates.user_create_validate_serializer import (
    UserCreateValidateSerializer,
)
from app.modules.account.serializers.validates.user_update_validate_serializer import (
    UserUpdateValidateSerializer,
)
from app.modules.account.services.user_service import UserService
from app.modules.iam.types.permission_rule import permission_rule
from app.modules.iam.views.admin_model_view_set import AdminModelViewSet


class UserViewSet(AdminModelViewSet[User]):
    """CRUD người dùng (không có xóa: khóa tài khoản bằng `is_active=false`)."""

    service_class = UserService
    filterset_class = UserFilter
    search_fields = ("email", "username", "first_name", "last_name")
    ordering_fields = ("created_at", "email", "last_login")
    ordering = ("-created_at",)
    list_serializer_class = UserListResponseSerializer
    detail_serializer_class = UserDetailResponseSerializer
    create_serializer_class = UserCreateValidateSerializer
    update_serializer_class = UserUpdateValidateSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]
    action_permissions = {
        "list": permission_rule(AccountPermission.USER_READ),
        "retrieve": permission_rule(AccountPermission.USER_READ),
        "create": permission_rule(AccountPermission.USER_CREATE),
        "partial_update": permission_rule(AccountPermission.USER_UPDATE),
    }
