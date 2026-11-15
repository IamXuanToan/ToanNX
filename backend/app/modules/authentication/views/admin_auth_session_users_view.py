"""Danh mục chủ phiên cho bộ lọc, dùng quyền xem phiên thay vì đọc tài khoản."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response

from app.core.pagination.core_page_number_pagination import CorePageNumberPagination
from app.modules.authentication.permissions.authentication_permission import AuthenticationPermission
from app.modules.authentication.serializers.responses.admin_session_user_response_serializer import (
    AdminSessionUserResponseSerializer,
)
from app.modules.authentication.services.admin_auth_session_service import AdminAuthSessionService
from app.modules.iam.decorators.require_permission import require_permission
from app.modules.iam.views.admin_api_view import AdminApiView


class AdminAuthSessionUsersView(AdminApiView):
    """Trả danh mục phân trang, không yêu cầu quyền xem hồ sơ người dùng."""

    pagination_class = CorePageNumberPagination

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service theo request."""
        super().__init__(**kwargs)
        self.admin_auth_session_service = AdminAuthSessionService()

    @extend_schema(responses=AdminSessionUserResponseSerializer(many=True))
    @require_permission(AuthenticationPermission.SESSION_READ)
    def get(self, request: Request) -> Response:
        """Liệt kê một lần mỗi chủ phiên, mới nhất trước, theo phân trang chuẩn."""
        paginator = CorePageNumberPagination()
        items = paginator.paginate_queryset(self.admin_auth_session_service.get_user_choices(), request)
        return paginator.get_paginated_response(AdminSessionUserResponseSerializer(items, many=True).data)
