"""Permission mặc định toàn hệ thống: mọi API phải khai quyền IAM (mặc định DENY)."""

from typing import Any

from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from app.core.exceptions.authorization_error import AuthorizationError
from app.iam.decorators.require_permission import PERMISSION_RULE_ATTR
from app.iam.types.permission_rule import PermissionRule


class HasIamPermission(BasePermission):
    """Đọc quy tắc quyền của request và kiểm tra.

    - ViewSet: `view.action_permissions[view.action]` (khai bằng `permission_rule(...)`).
    - APIView: quy tắc do `@require_permission(...)` gắn trên method xử lý.

    Không khai quy tắc → 403 `PERMISSION_DENIED`. Superuser luôn đạt bước quyền (PermissionChecker).
    View cần mở hơn (công khai, chỉ cần đăng nhập) ghi đè `permission_classes` ngay trong view đó.
    """

    def has_permission(self, request: Request, view: Any) -> bool:
        """Kiểm tra quyền của request.

        Args:
            request: DRF request.
            view: View đang xử lý.

        Returns:
            True nếu được phép.

        Raises:
            AuthorizationError: Chưa khai quyền hoặc thiếu quyền.
        """
        rule = self._get_rule(request, view)
        if rule is None:
            raise AuthorizationError()
        rule.enforce(request, view)
        return True

    @staticmethod
    def _get_rule(request: Request, view: Any) -> PermissionRule | None:
        """Quy tắc của action (ViewSet) hoặc của method (APIView)."""
        action = getattr(view, "action", None)
        if action is not None:
            rules: dict[str, PermissionRule] = getattr(view, "action_permissions", {})
            return rules.get(action)
        handler = getattr(view, (request.method or "").lower(), None)
        return getattr(handler, PERMISSION_RULE_ATTR, None)
