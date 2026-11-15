"""API danh mục quyền (chỉ đọc): /iam/permissions và /iam/permissions/{id}.

GET /iam/permissions?module=iam&search=&ordering=&page=&page_size=
"""

from app.core.views.core_model_view_set import CoreModelViewSet
from app.modules.iam.filters.permission_filter import PermissionFilter
from app.modules.iam.models.permission import Permission
from app.modules.iam.permissions.iam_permission import IamPermission
from app.modules.iam.serializers.responses.permission_list_response_serializer import (
    PermissionListResponseSerializer,
)
from app.modules.iam.services.permission_service import PermissionService
from app.modules.iam.types.permission_rule import permission_rule


class PermissionViewSet(CoreModelViewSet[Permission]):
    """Danh mục quyền do các module khai báo."""

    service_class = PermissionService
    filterset_class = PermissionFilter
    search_fields = ("code", "name", "description")
    ordering_fields = ("code", "module", "created_at")
    ordering = ("-created_at", "-pk")
    list_serializer_class = PermissionListResponseSerializer
    detail_serializer_class = PermissionListResponseSerializer
    http_method_names = ["get", "head", "options"]
    action_permissions = {
        "list": permission_rule(IamPermission.PERMISSION_READ),
        "retrieve": permission_rule(IamPermission.PERMISSION_READ),
    }
