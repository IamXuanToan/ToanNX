"""API quản trị phiên.

GET    /auth/admin-sessions?search=&status=&user=&ordering=&page=&page_size=
DELETE /auth/admin-sessions/{id}            (thu hồi, giữ lịch sử)
POST   /auth/admin-sessions/bulk-delete     (xóa mềm cả lô, action core)
POST   /auth/admin-sessions/bulk-revoke     (thu hồi cả lô)
GET    /auth/admin-sessions/users           (danh mục chủ phiên cho bộ lọc)
"""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from app.core.responses.core_response import CoreResponse
from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer
from app.core.serializers.core_bulk_result_response_serializer import CoreBulkResultResponseSerializer
from app.core.views.core_model_view_set import CoreModelViewSet
from app.system.filters.admin_auth_session_filter import AdminAuthSessionFilter
from app.system.models.auth_session import AuthSession
from app.system.permissions.session_permission import SessionPermission
from app.system.serializers.responses.admin_auth_session_response_serializer import (
    AdminAuthSessionResponseSerializer,
)
from app.system.serializers.responses.admin_session_user_response_serializer import (
    AdminSessionUserResponseSerializer,
)
from app.system.services.admin_auth_session_service import AdminAuthSessionService
from app.system.services.auth_cookie_service import AuthCookieService
from app.system.types.permission_rule import DENY, permission_rule


class AdminAuthSessionViewSet(CoreModelViewSet[AuthSession]):
    """Danh sách có phân trang; DELETE chỉ thu hồi, không xóa bản ghi phiên.

    `POST /admin-sessions` (create) đóng bằng `DENY`: phiên chỉ tạo qua đăng nhập.
    """

    service_class = AdminAuthSessionService
    service: AdminAuthSessionService
    filterset_class = AdminAuthSessionFilter
    search_fields = ("user__email", "user__first_name", "user__last_name", "user_agent", "ip_address")
    ordering_fields = ("created_at", "last_used_at", "expires_at", "user__email")
    ordering = ("-created_at", "pk")
    list_serializer_class = AdminAuthSessionResponseSerializer
    detail_serializer_class = AdminAuthSessionResponseSerializer
    bulk_delete_enabled = True
    http_method_names = ["get", "post", "delete", "head", "options"]
    action_permissions = {
        "list": permission_rule(SessionPermission.SESSION_READ),
        "retrieve": permission_rule(SessionPermission.SESSION_READ),
        "create": DENY,  # phiên chỉ tạo qua đăng nhập; POST chỉ mở cho bulk
        "users": permission_rule(SessionPermission.SESSION_READ),
        "destroy": permission_rule(SessionPermission.SESSION_REVOKE),
        "bulk_revoke": permission_rule(SessionPermission.SESSION_REVOKE),
        "bulk_delete": permission_rule(SessionPermission.SESSION_DELETE),
    }

    def get_serializer_context(self) -> dict[str, Any]:
        """Đánh dấu phiên của request hiện tại, không lấy từ dữ liệu client."""
        return {
            **super().get_serializer_context(),
            "current_session_id": getattr(self.request.auth, "pk", None),
        }

    def destroy(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Thu hồi phiên và xóa cookie khi quản trị viên thu hồi chính phiên đang dùng."""
        response = super().destroy(request, *args, **kwargs)
        if str(getattr(request.auth, "pk", "")) == str(kwargs["pk"]):
            AuthCookieService.clear_cookies(response)
        return response

    @extend_schema(request=CoreBulkIdsValidateSerializer, responses=CoreBulkResultResponseSerializer)
    @action(detail=False, methods=["post"], url_path="bulk-revoke")
    def bulk_revoke(self, request: Request) -> CoreResponse:
        """Thu hồi nhiều phiên; thu hồi cả phiên đang dùng thì xóa cookie của request này."""
        ids = CoreBulkIdsValidateSerializer.validate_data(request.data)["ids"]
        count = self.service.bulk_revoke(self.get_actor(request), ids)
        response = CoreResponse(CoreBulkResultResponseSerializer({"count": count}).data)
        current = str(getattr(request.auth, "pk", ""))
        if current and current in {str(pk) for pk in ids}:
            AuthCookieService.clear_cookies(response)
        return response

    @extend_schema(responses=AdminSessionUserResponseSerializer(many=True))
    @action(detail=False, methods=["get"], filter_backends=[])
    def users(self, request: Request) -> Response:
        """Mỗi chủ phiên một lần, mới nhất trước (bộ lọc theo người dùng)."""
        return self.paginated(self.service.get_user_choices(), AdminSessionUserResponseSerializer)
