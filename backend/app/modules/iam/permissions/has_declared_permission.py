"""Permission bảo đảm mọi method của APIView quản trị đã khai báo quyền (mặc định DENY)."""

from typing import Any

from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from app.core.exceptions.authorization_error import AuthorizationError
from app.modules.iam.decorators.require_permission import PERMISSION_RULE_ATTR


class HasDeclaredPermission(BasePermission):
    """Từ chối nếu method xử lý request chưa gắn `@require_permission`.

    Quyền thực tế được kiểm tra trong decorator; class này chặn trường hợp quên khai báo.
    """

    def has_permission(self, request: Request, view: Any) -> bool:
        """Kiểm tra method đã khai báo quyền.

        Args:
            request: DRF request.
            view: View.

        Returns:
            True nếu đã khai báo.

        Raises:
            AuthorizationError: Method chưa khai báo quyền.
        """
        handler = getattr(view, (request.method or "").lower(), None)
        if handler is not None and getattr(handler, PERMISSION_RULE_ATTR, None) is not None:
            return True
        raise AuthorizationError()
