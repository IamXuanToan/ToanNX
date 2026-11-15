"""API cập nhật người dùng hàng loạt: POST /account/users/bulk-update."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.serializers.core_bulk_result_response_serializer import CoreBulkResultResponseSerializer
from app.modules.account.permissions.account_permission import AccountPermission
from app.modules.account.serializers.validates.user_bulk_update_validate_serializer import (
    UserBulkUpdateValidateSerializer,
)
from app.modules.account.services.user_service import UserService
from app.modules.iam.decorators.require_permission import require_permission
from app.modules.iam.views.admin_api_view import AdminApiView


class UserBulkUpdateView(AdminApiView):
    """Khóa/mở nhiều tài khoản cùng lúc (cùng luật với cập nhật từng người)."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.service = UserService()

    @extend_schema(responses=CoreBulkResultResponseSerializer)
    @require_permission(AccountPermission.USER_UPDATE)
    @validate_request(UserBulkUpdateValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Cập nhật `is_active` của nhiều người dùng (tất cả hoặc không gì cả).

        Args:
            request: Request.
            validated_data: Body đã validate.

        Returns:
            Số bản ghi đã xử lý.
        """
        count = self.service.bulk_update(
            self.get_actor(request), validated_data["ids"], {"is_active": validated_data["is_active"]}
        )
        return CoreResponse(CoreBulkResultResponseSerializer({"count": count}).data)
