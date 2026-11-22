"""API người dùng: /account/users và /account/users/{id}.

GET    /account/users?search=&is_active=&is_staff=&ordering=&page=&page_size=
POST   /account/users
GET    /account/users/{id}
PATCH  /account/users/{id}
DELETE /account/users/{id}   (xóa mềm)
POST   /account/users/bulk-update · /account/users/bulk-delete
GET    /account/users/{id}/history
"""

from typing import Any

from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.filters.user_filter import UserFilter
from app.system.models.user import User
from app.system.permissions.user_permission import UserPermission
from app.system.serializers.responses.user_detail_response_serializer import (
    UserDetailResponseSerializer,
)
from app.system.serializers.responses.user_list_response_serializer import (
    UserListResponseSerializer,
)
from app.system.serializers.validates.user_bulk_update_validate_serializer import (
    UserBulkUpdateValidateSerializer,
)
from app.system.serializers.validates.user_create_validate_serializer import (
    UserCreateValidateSerializer,
)
from app.system.serializers.validates.user_update_validate_serializer import (
    UserUpdateValidateSerializer,
)
from app.system.services.user_service import UserService
from app.system.types.permission_rule import permission_rule


class UserViewSet(CoreModelViewSet[User]):
    """CRUD người dùng (xóa là xóa mềm)."""

    service_class = UserService
    service: UserService
    filterset_class = UserFilter
    search_fields = ("email", "username", "full_name")
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
        "list": permission_rule(UserPermission.USER_READ),
        "retrieve": permission_rule(UserPermission.USER_READ),
        "create": permission_rule(UserPermission.USER_CREATE),
        "partial_update": permission_rule(UserPermission.USER_UPDATE),
        "destroy": permission_rule(UserPermission.USER_DELETE),
        "bulk_update": permission_rule(UserPermission.USER_UPDATE),
        "bulk_delete": permission_rule(UserPermission.USER_DELETE),
        "history": permission_rule(UserPermission.USER_READ),
    }

    def create(self, request: Request, *args: Any, **kwargs: Any) -> CoreResponse:
        """Tạo người dùng mới (201). Hỗ trợ gửi email mời kích hoạt tài khoản."""
        data = self._validate(self.create_serializer_class, request.data)
        instance = self.service.create(self.get_actor(request), data, request=request._request)
        return CoreResponse(self.serialize_detail(self.get_object_for_actor(instance.pk)), status=201)
