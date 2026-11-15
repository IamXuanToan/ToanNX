"""API thu hồi phiên hàng loạt: POST /auth/admin-sessions/bulk-revoke."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.decorators.validate_request import validate_request
from app.core.responses.core_response import CoreResponse
from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer
from app.core.serializers.core_bulk_result_response_serializer import CoreBulkResultResponseSerializer
from app.modules.authentication.permissions.authentication_permission import AuthenticationPermission
from app.modules.authentication.services.admin_auth_session_service import AdminAuthSessionService
from app.modules.authentication.services.auth_cookie_service import AuthCookieService
from app.modules.iam.decorators.require_permission import require_permission
from app.modules.iam.views.admin_api_view import AdminApiView


class AdminAuthSessionBulkRevokeView(AdminApiView):
    """Thu hồi nhiều phiên cùng lúc; giữ lịch sử phiên."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.service = AdminAuthSessionService()

    @extend_schema(responses=CoreBulkResultResponseSerializer)
    @require_permission(AuthenticationPermission.SESSION_REVOKE)
    @validate_request(CoreBulkIdsValidateSerializer)
    def post(self, request: Request, validated_data: dict[str, Any]) -> CoreResponse:
        """Thu hồi các phiên; thu hồi cả phiên đang dùng thì xoá cookie của request này.

        Args:
            request: Request.
            validated_data: Body đã validate.

        Returns:
            Số phiên đã thu hồi.
        """
        ids = validated_data["ids"]
        count = self.service.bulk_revoke(self.get_actor(request), ids)
        response = CoreResponse(CoreBulkResultResponseSerializer({"count": count}).data)
        current = str(getattr(request.auth, "pk", ""))
        if current and current in {str(pk) for pk in ids}:
            AuthCookieService.clear_cookies(response)
        return response
