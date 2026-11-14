"""Đánh giá quyền hiệu lực của người dùng (RBAC, mặc định DENY)."""

from collections.abc import Iterable
from typing import Any

from app.core.registry.permission_definition import PermissionDefinition
from app.modules.iam.repositories.permission_repository import PermissionRepository

_CACHE_ATTR = "_iam_permission_cache"

PermissionLike = PermissionDefinition | str


def _code(permission: PermissionLike) -> str:
    """Nhận cả PermissionDefinition lẫn mã quyền dạng chuỗi."""
    return permission.code if isinstance(permission, PermissionDefinition) else permission


class PermissionChecker:
    """Kiểm tra quyền: xác thực → is_active → superuser → quyền từ vai trò.

    Quyền tính một lần mỗi request và cache trên chính đối tượng user (user được nạp
    mới mỗi request nên cache tự hết hạn; không có cache xuyên request).
    """

    def __init__(self, permission_repository: PermissionRepository | None = None) -> None:
        """Khởi tạo checker.

        Args:
            permission_repository: Repository quyền.
        """
        self.permission_repository = permission_repository or PermissionRepository()

    def get_permissions(self, user: Any) -> frozenset[str]:
        """Tập mã quyền hiệu lực.

        Args:
            user: Người dùng.

        Returns:
            Tập mã quyền (rỗng nếu chưa đăng nhập hoặc bị khóa).
        """
        if user is None or not getattr(user, "is_authenticated", False) or not user.is_active:
            return frozenset()
        cached: frozenset[str] | None = getattr(user, _CACHE_ATTR, None)
        if cached is None:
            cached = self.permission_repository.get_codes_for_user(user.pk)
            setattr(user, _CACHE_ATTR, cached)
        return cached

    def has_permission(self, user: Any, permission: PermissionLike) -> bool:
        """Kiểm tra một quyền.

        Args:
            user: Người dùng.
            permission: Định nghĩa quyền hoặc mã quyền.

        Returns:
            True nếu được phép.
        """
        # ============================================================
        # BƯỚC 1-2: Phải đăng nhập và tài khoản đang hoạt động
        # ============================================================
        if user is None or not getattr(user, "is_authenticated", False) or not user.is_active:
            return False
        # ============================================================
        # BƯỚC 3: Superuser được phép ở tầng ứng dụng
        # ============================================================
        if user.is_superuser:
            return True
        # ============================================================
        # BƯỚC 4-8: Tổng hợp quyền từ vai trò; không có thì DENY
        # ============================================================
        return _code(permission) in self.get_permissions(user)

    def has_any_permission(self, user: Any, permissions: Iterable[PermissionLike]) -> bool:
        """Có ít nhất một quyền.

        Args:
            user: Người dùng.
            permissions: Danh sách quyền.

        Returns:
            True nếu có ít nhất một quyền.
        """
        return any(self.has_permission(user, item) for item in permissions)

    def has_all_permissions(self, user: Any, permissions: Iterable[PermissionLike]) -> bool:
        """Có tất cả quyền.

        Args:
            user: Người dùng.
            permissions: Danh sách quyền.

        Returns:
            True nếu có đủ.
        """
        return all(self.has_permission(user, item) for item in permissions)

    def invalidate(self, user: Any) -> None:
        """Xóa cache quyền trên đối tượng user (sau khi đổi vai trò trong cùng request).

        Args:
            user: Người dùng.
        """
        if hasattr(user, _CACHE_ATTR):
            delattr(user, _CACHE_ATTR)


permission_checker = PermissionChecker()
