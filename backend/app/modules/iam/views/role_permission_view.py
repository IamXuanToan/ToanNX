"""API quyền của vai trò.

POST   /iam/roles/{role_id}/permissions                    body: {"permission_id": "..."}
DELETE /iam/roles/{role_id}/permissions/{permission_id}
"""

from typing import Any
from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.modules.iam.decorators.require_permission import require_permission
from app.modules.iam.permissions.iam_permission import IamPermission
from app.modules.iam.serializers.responses.role_detail_response_serializer import (
    RoleDetailResponseSerializer,
)
from app.modules.iam.serializers.validates.role_permission_assign_validate_serializer import (
    RolePermissionAssignValidateSerializer,
)
from app.modules.iam.services.role_permission_service import RolePermissionService
from app.modules.iam.services.role_service import RoleService
from app.modules.iam.views.admin_api_view import AdminApiView


class RolePermissionView(AdminApiView):
    """Gán quyền cho vai trò."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.role_service = RoleService()
        self.role_permission_service = RolePermissionService(role_service=self.role_service)

    @extend_schema(responses=RoleDetailResponseSerializer)
    @require_permission(IamPermission.PERMISSION_ASSIGN)
    @validate_request(RolePermissionAssignValidateSerializer)
    def post(self, request: Request, role_id: UUID, validated_data: dict[str, Any]) -> CoreResponse:
        """Gán quyền (idempotent).

        Args:
            request: Request.
            role_id: Id vai trò.
            validated_data: Body đã validate.

        Returns:
            Vai trò kèm quyền.
        """
        self.role_permission_service.assign_permission(
            self.get_actor(request), role_id, validated_data["permission_id"]
        )
        return CoreResponse(RoleDetailResponseSerializer(self.role_service.get_by_id(role_id)).data)


class RolePermissionObjectView(AdminApiView):
    """Thu hồi quyền khỏi vai trò."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.role_permission_service = RolePermissionService()

    @extend_schema(responses={204: None})
    @require_permission(IamPermission.PERMISSION_ASSIGN)
    def delete(self, request: Request, role_id: UUID, permission_id: UUID) -> Response:
        """Thu hồi quyền.

        Args:
            request: Request.
            role_id: Id vai trò.
            permission_id: Id quyền.

        Returns:
            204 không body.
        """
        self.role_permission_service.revoke_permission(self.get_actor(request), role_id, permission_id)
        return Response(status=204)
