"""API xóa vai trò hàng loạt: POST /iam/roles/bulk-delete."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer
from app.core.serializers.core_bulk_result_response_serializer import CoreBulkResultResponseSerializer
from app.modules.iam.decorators.require_permission import require_permission
from app.modules.iam.permissions.iam_permission import IamPermission
from app.modules.iam.services.role_service import RoleService
from app.modules.iam.views.admin_api_view import AdminApiView


class RoleBulkDeleteView(AdminApiView):
    """Xóa mềm nhiều vai trò tự tạo cùng lúc."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.service = RoleService()

    @extend_schema(responses=CoreBulkResultResponseSerializer)
    @require_permission(IamPermission.ROLE_DELETE)
    @validate_request(CoreBulkIdsValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Xóa mềm nhiều vai trò (tất cả hoặc không gì cả).

        Args:
            request: Request.
            validated_data: Body đã validate.

        Returns:
            Số bản ghi đã xử lý.
        """
        count = self.service.bulk_delete(self.get_actor(request), validated_data["ids"])
        return CoreResponse(CoreBulkResultResponseSerializer({"count": count}).data)
