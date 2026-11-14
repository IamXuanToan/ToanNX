"""View gốc cho API chỉ yêu cầu đăng nhập (không cần quyền quản trị)."""

from rest_framework.permissions import BasePermission

from app.core.views.core_api_view import CoreApiView
from app.modules.iam.permissions.is_active_authenticated import IsActiveAuthenticated


class AuthenticatedApiView(CoreApiView):
    """Bắt buộc đăng nhập + tài khoản đang hoạt động."""

    permission_classes: list[type[BasePermission]] = [IsActiveAuthenticated]
