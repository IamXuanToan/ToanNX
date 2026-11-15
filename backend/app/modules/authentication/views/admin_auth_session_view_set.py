"""API quản trị phiên: danh sách và thu hồi theo quyền IAM riêng."""

from typing import Any

from rest_framework.request import Request
from rest_framework.response import Response

from app.modules.authentication.filters.admin_auth_session_filter import AdminAuthSessionFilter
from app.modules.authentication.models.auth_session import AuthSession
from app.modules.authentication.permissions.authentication_permission import AuthenticationPermission
from app.modules.authentication.serializers.responses.admin_auth_session_response_serializer import (
    AdminAuthSessionResponseSerializer,
)
from app.modules.authentication.services.admin_auth_session_service import AdminAuthSessionService
from app.modules.authentication.services.auth_cookie_service import AuthCookieService
from app.modules.iam.types.permission_rule import permission_rule
from app.modules.iam.views.admin_model_view_set import AdminModelViewSet


class AdminAuthSessionViewSet(AdminModelViewSet[AuthSession]):
    """Danh sách có phân trang; DELETE chỉ thu hồi, không xóa bản ghi phiên."""

    service_class = AdminAuthSessionService
    filterset_class = AdminAuthSessionFilter
    search_fields = ("user__email", "user__first_name", "user__last_name", "user_agent", "ip_address")
    ordering_fields = ("created_at", "last_used_at", "expires_at", "user__email")
    ordering = ("-created_at", "pk")
    list_serializer_class = AdminAuthSessionResponseSerializer
    detail_serializer_class = AdminAuthSessionResponseSerializer
    http_method_names = ["get", "delete", "head", "options"]
    action_permissions = {
        "list": permission_rule(AuthenticationPermission.SESSION_READ),
        "destroy": permission_rule(AuthenticationPermission.SESSION_REVOKE),
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
