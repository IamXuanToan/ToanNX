"""DRF permission bắt buộc CSRF."""

from typing import Any

from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from app.core.security.csrf import enforce_csrf


class CsrfProtected(BasePermission):
    """Bắt buộc CSRF cho endpoint không qua authentication cookie (login/refresh/logout)."""

    def has_permission(self, request: Request, view: Any) -> bool:
        """Kiểm tra CSRF.

        Args:
            request: DRF request.
            view: View.

        Returns:
            True nếu hợp lệ (ngược lại raise AuthorizationError).
        """
        enforce_csrf(request._request)
        return True
