"""Permission vào khu vực quản trị."""

from typing import Any

from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.authorization_error import AuthorizationError


class IsAdminArea(BasePermission):
    """Yêu cầu is_staff hoặc superuser. Không thay thế kiểm tra quyền từng chức năng."""

    def has_permission(self, request: Request, view: Any) -> bool:
        """Kiểm tra is_staff.

        Args:
            request: DRF request.
            view: View.

        Returns:
            True nếu được phép.

        Raises:
            AuthorizationError: ADMIN_ACCESS_REQUIRED.
        """
        user = request.user
        if user.is_staff or user.is_superuser:
            return True
        raise AuthorizationError(
            "Bạn không có quyền truy cập khu vực quản trị.", code=ErrorCode.ADMIN_ACCESS_REQUIRED
        )
