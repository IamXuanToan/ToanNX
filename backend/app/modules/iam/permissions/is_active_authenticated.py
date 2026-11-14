"""Permission mặc định toàn hệ thống."""

from typing import Any

from rest_framework.permissions import BasePermission
from rest_framework.request import Request


class IsActiveAuthenticated(BasePermission):
    """Yêu cầu đã đăng nhập và tài khoản đang hoạt động (DEFAULT_PERMISSION_CLASSES)."""

    def has_permission(self, request: Request, view: Any) -> bool:
        """Kiểm tra xác thực.

        Args:
            request: DRF request.
            view: View.

        Returns:
            True nếu hợp lệ; False để DRF trả 401.
        """
        user = request.user
        return bool(user and user.is_authenticated and user.is_active)
