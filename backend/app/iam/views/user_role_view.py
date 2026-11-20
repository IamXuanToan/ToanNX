"""API vai trò của người dùng.

GET    /iam/users/{user_id}/roles
POST   /iam/users/{user_id}/roles             body: {"role_id": "..."}
PUT    /iam/users/{user_id}/roles             body: {"role_ids": [...]}  (thay toàn bộ, một transaction)
DELETE /iam/users/{user_id}/roles/{role_id}
"""

from typing import Any
from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.iam.decorators.require_permission import require_permission
from app.iam.permissions.iam_permission import IamPermission
from app.iam.serializers.responses.role_summary_response_serializer import (
    RoleSummaryResponseSerializer,
)
from app.iam.serializers.validates.user_role_assign_validate_serializer import (
    UserRoleAssignValidateSerializer,
)
from app.iam.serializers.validates.user_role_sync_validate_serializer import (
    UserRoleSyncValidateSerializer,
)
from app.iam.services.user_role_service import UserRoleService


class UserRoleView(CoreApiView):
    """Xem và gán vai trò của người dùng."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.user_role_service = UserRoleService()

    @extend_schema(responses=RoleSummaryResponseSerializer(many=True))
    @require_permission(IamPermission.ROLE_READ, IamPermission.ROLE_ASSIGN)
    def get(self, request: Request, user_id: UUID) -> CoreResponse:
        """Vai trò đang gán cho người dùng.

        Args:
            request: Request.
            user_id: Id người dùng.

        Returns:
            Danh sách vai trò.
        """
        roles = self.user_role_service.list_roles(user_id)
        return CoreResponse(RoleSummaryResponseSerializer(roles, many=True).data)

    @extend_schema(responses=RoleSummaryResponseSerializer(many=True))
    @require_permission(IamPermission.ROLE_ASSIGN)
    @validate_request(UserRoleAssignValidateSerializer)
    def post(self, request: Request, user_id: UUID, validated_data: dict[str, Any]) -> CoreResponse:
        """Gán vai trò (idempotent).

        Args:
            request: Request.
            user_id: Id người dùng.
            validated_data: Body đã validate.

        Returns:
            Vai trò của người dùng sau khi gán.
        """
        self.user_role_service.assign_role(self.get_actor(request), user_id, validated_data["role_id"])
        roles = self.user_role_service.list_roles(user_id)
        return CoreResponse(RoleSummaryResponseSerializer(roles, many=True).data)

    @extend_schema(responses=RoleSummaryResponseSerializer(many=True))
    @require_permission(IamPermission.ROLE_ASSIGN)
    @validate_request(UserRoleSyncValidateSerializer)
    def put(self, request: Request, user_id: UUID, validated_data: dict[str, Any]) -> CoreResponse:
        """Thay toàn bộ vai trò trong một transaction (lỗi một vai trò thì không đổi gì).

        Args:
            request: Request.
            user_id: Id người dùng.
            validated_data: Body đã validate.

        Returns:
            Vai trò của người dùng sau khi đồng bộ.
        """
        roles = self.user_role_service.sync_roles(
            self.get_actor(request), user_id, validated_data["role_ids"]
        )
        return CoreResponse(RoleSummaryResponseSerializer(roles, many=True).data)


class UserRoleObjectView(CoreApiView):
    """Thu hồi vai trò của người dùng."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.user_role_service = UserRoleService()

    @extend_schema(responses={204: None})
    @require_permission(IamPermission.ROLE_ASSIGN)
    def delete(self, request: Request, user_id: UUID, role_id: UUID) -> Response:
        """Thu hồi vai trò.

        Args:
            request: Request.
            user_id: Id người dùng.
            role_id: Id vai trò.

        Returns:
            204 không body.
        """
        self.user_role_service.revoke_role(self.get_actor(request), user_id, role_id)
        return Response(status=204)
