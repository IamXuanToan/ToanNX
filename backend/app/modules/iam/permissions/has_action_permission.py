"""Permission kiểm tra quyền theo action của ViewSet (mặc định DENY)."""

from typing import Any

from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from app.core.exceptions.authorization_error import AuthorizationError
from app.modules.iam.types.permission_rule import PermissionRule


class HasActionPermission(BasePermission):
    """Đọc `view.action_permissions = {"list": permission_rule(...), ...}`.

    Action không có trong map bị từ chối.
    """

    def has_permission(self, request: Request, view: Any) -> bool:
        """Kiểm tra quyền của action hiện tại.

        Args:
            request: DRF request.
            view: ViewSet có `action_permissions`.

        Returns:
            True nếu được phép.

        Raises:
            AuthorizationError: Action chưa khai báo hoặc thiếu quyền.
        """
        rules: dict[str, PermissionRule] = getattr(view, "action_permissions", {})
        rule = rules.get(getattr(view, "action", None) or "")
        if rule is None:
            raise AuthorizationError()
        rule.enforce(request, view)
        return True
