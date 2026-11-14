"""ViewSet gốc cho tài nguyên CRUD trong khu vực quản trị."""

from django.db.models import Model
from rest_framework.permissions import BasePermission

from app.core.views.core_model_view_set import CoreModelViewSet
from app.modules.iam.permissions.has_action_permission import HasActionPermission
from app.modules.iam.permissions.is_active_authenticated import IsActiveAuthenticated
from app.modules.iam.permissions.is_admin_area import IsAdminArea
from app.modules.iam.types.permission_rule import PermissionRule


class AdminModelViewSet[M: Model](CoreModelViewSet[M]):
    """Đăng nhập + active → is_staff → quyền theo action (`action_permissions`, mặc định DENY).

    ```python
    action_permissions = {
        "list": permission_rule(AccountPermission.USER_READ),
        "retrieve": permission_rule(AccountPermission.USER_READ),
        "create": permission_rule(AccountPermission.USER_CREATE),
        "partial_update": permission_rule(AccountPermission.USER_UPDATE),
    }
    ```
    """

    permission_classes: list[type[BasePermission]] = [IsActiveAuthenticated, IsAdminArea, HasActionPermission]
    action_permissions: dict[str, PermissionRule] = {}
