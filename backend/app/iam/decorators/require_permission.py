"""Decorator kiểm tra quyền cho method của APIView quản trị.

```python
@require_permission(UserPermission.USER_READ)                                   # một quyền
@require_permission(IamPermission.ROLE_ASSIGN, UserPermission.USER_UPDATE)      # ít nhất một
@require_permission(IamPermission.ROLE_ASSIGN, UserPermission.USER_UPDATE, require_all=True)
@require_permission(UserPermission.USER_UPDATE, check=is_not_self)              # + điều kiện riêng
@require_permission(UserPermission.USER_READ, allow_if=is_owner)                # hoặc chính chủ
```

- Đặt `@require_permission` NGOÀI `@validate_request` để kiểm tra quyền trước khi validate.
- `HasIamPermission` (mặc định trong settings) từ chối method không gắn decorator này (mặc định DENY).
- ViewSet dùng `action_permissions = {"list": permission_rule(...), ...}` với cùng ngữ nghĩa.
"""

from collections.abc import Callable
from functools import wraps
from typing import Any

from rest_framework.request import Request
from rest_framework.response import Response

from app.core.registry.permission_definition import PermissionDefinition
from app.iam.types.permission_rule import PermissionCheck, PermissionRule

ViewMethod = Callable[..., Response]

PERMISSION_RULE_ATTR = "permission_rule"


def require_permission(
    *permissions: PermissionDefinition,
    require_all: bool = False,
    check: PermissionCheck | None = None,
    allow_if: PermissionCheck | None = None,
) -> Callable[[ViewMethod], ViewMethod]:
    """Tạo decorator yêu cầu quyền.

    Args:
        *permissions: Quyền yêu cầu (từ PermissionCatalog của module).
        require_all: True = cần đủ mọi quyền; mặc định cần ít nhất một.
        check: Hàm `(request, view) -> bool` bắt buộc trả True (AND).
        allow_if: Hàm `(request, view) -> bool`; trả True thì cho phép ngay (OR).

    Returns:
        Decorator cho method của view.
    """
    rule = PermissionRule(permissions=permissions, require_all=require_all, check=check, allow_if=allow_if)

    def decorator(view_method: ViewMethod) -> ViewMethod:
        @wraps(view_method)
        def wrapper(self: Any, request: Request, *args: Any, **kwargs: Any) -> Response:
            rule.enforce(request, self)
            return view_method(self, request, *args, **kwargs)

        setattr(wrapper, PERMISSION_RULE_ATTR, rule)
        return wrapper

    return decorator
