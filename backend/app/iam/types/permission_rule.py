"""Quy tắc quyền dùng chung cho decorator `@require_permission` và `action_permissions` của ViewSet."""

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from rest_framework.request import Request

from app.core.exceptions.authorization_error import AuthorizationError
from app.core.registry.permission_definition import PermissionDefinition
from app.iam.services.permission_checker import permission_checker

PermissionCheck = Callable[[Request, Any], bool]
"""Hàm điều kiện tùy chỉnh: nhận (request, view) và trả True/False. URL kwargs ở `view.kwargs`."""


@dataclass(frozen=True)
class PermissionRule:
    """Điều kiện truy cập một action.

    Thứ tự đánh giá:
    1. `allow_if` trả True → cho phép ngay (ví dụ chính chủ xem hồ sơ của mình).
    2. Quyền: có ÍT NHẤT MỘT quyền (mặc định) hoặc TẤT CẢ quyền (`require_all=True`).
       Superuser luôn đạt bước này. Không khai báo quyền nào = bỏ qua bước này.
    3. `check` (nếu có) phải trả True (điều kiện bổ sung, áp dụng cả với superuser).

    Attributes:
        permissions: Danh sách quyền.
        require_all: True = cần đủ mọi quyền; False = cần ít nhất một.
        check: Điều kiện bắt buộc thêm (AND).
        allow_if: Điều kiện cho phép thay thế (OR với bước 2-3).
        denies_all: Rule đóng tường minh (`DENY`); core bỏ qua kiểm tra serializer của action này.
    """

    permissions: tuple[PermissionDefinition, ...] = field(default_factory=tuple)
    require_all: bool = False
    check: PermissionCheck | None = None
    allow_if: PermissionCheck | None = None
    denies_all: bool = False

    def __post_init__(self) -> None:
        """Không cho tạo rule rỗng (dễ vô tình mở quyền).

        Raises:
            ValueError: Không có quyền, check hay allow_if nào.
        """
        if not self.permissions and self.check is None and self.allow_if is None:
            raise ValueError("PermissionRule cần ít nhất một quyền, check hoặc allow_if.")

    def is_satisfied(self, request: Request, view: Any) -> bool:
        """Đánh giá rule.

        Args:
            request: DRF request.
            view: View đang xử lý.

        Returns:
            True nếu được phép.
        """
        # ============================================================
        # BƯỚC 1: Điều kiện cho phép thay thế
        # ============================================================
        if self.allow_if is not None and self.allow_if(request, view):
            return True

        # ============================================================
        # BƯỚC 2: Quyền (any/all)
        # ============================================================
        if self.permissions:
            has = (
                permission_checker.has_all_permissions
                if self.require_all
                else permission_checker.has_any_permission
            )
            if not has(request.user, self.permissions):
                return False

        # ============================================================
        # BƯỚC 3: Điều kiện bổ sung
        # ============================================================
        return self.check is None or self.check(request, view)

    def enforce(self, request: Request, view: Any) -> None:
        """Ném lỗi nếu rule không thỏa.

        Args:
            request: DRF request.
            view: View đang xử lý.

        Raises:
            AuthorizationError: PERMISSION_DENIED kèm danh sách quyền yêu cầu.
        """
        if not self.is_satisfied(request, view):
            raise AuthorizationError(details={"permissions": [item.code for item in self.permissions]})


def permission_rule(
    *permissions: PermissionDefinition,
    require_all: bool = False,
    check: PermissionCheck | None = None,
    allow_if: PermissionCheck | None = None,
) -> PermissionRule:
    """Tạo PermissionRule gọn (dùng trong `action_permissions` của ViewSet).

    Args:
        *permissions: Quyền yêu cầu.
        require_all: Cần đủ mọi quyền.
        check: Điều kiện bổ sung (AND).
        allow_if: Điều kiện cho phép thay thế (OR).

    Returns:
        PermissionRule.
    """
    return PermissionRule(permissions=permissions, require_all=require_all, check=check, allow_if=allow_if)


def _never(request: Request, view: Any) -> bool:
    """Luôn từ chối."""
    return False


DENY = PermissionRule(check=_never, denies_all=True)
"""Đóng tường minh một action router tự sinh mà tài nguyên không hỗ trợ (ví dụ `create` của phiên)."""
