"""URL của IAM (/api/v1/iam/...).

CRUD chuẩn đăng ký qua router (không dấu `/` cuối); sub-resource dùng APIView.
"""

from django.urls import path
from rest_framework.routers import SimpleRouter

from app.modules.iam.views.permission_view_set import PermissionViewSet
from app.modules.iam.views.role_permission_view import RolePermissionObjectView, RolePermissionView
from app.modules.iam.views.role_view_set import RoleViewSet
from app.modules.iam.views.user_role_view import UserRoleObjectView, UserRoleView

app_name = "iam"

router = SimpleRouter(trailing_slash=False)
router.register("roles", RoleViewSet, basename="roles")
router.register("permissions", PermissionViewSet, basename="permissions")

urlpatterns = [
    path("users/<uuid:user_id>/roles", UserRoleView.as_view(), name="user-roles"),
    path("users/<uuid:user_id>/roles/<uuid:role_id>", UserRoleObjectView.as_view(), name="user-roles-object"),
    path("roles/<uuid:role_id>/permissions", RolePermissionView.as_view(), name="role-permissions"),
    path(
        "roles/<uuid:role_id>/permissions/<uuid:permission_id>",
        RolePermissionObjectView.as_view(),
        name="role-permissions-object",
    ),
    *router.urls,
]
