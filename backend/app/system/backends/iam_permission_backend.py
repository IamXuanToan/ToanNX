"""Authentication backend Django chỉ trả lời câu hỏi quyền, nguồn là IAM."""

from typing import Any

from django.contrib.auth.backends import BaseBackend

from app.system.services.permission_checker import PermissionChecker, permission_checker


class IamPermissionBackend(BaseBackend):
    """`user.has_perm()` / `has_module_perms()` của Django ủy quyền cho PermissionChecker.

    Không xác thực (authenticate trả None mặc định); xác thực do `AccountAuthBackend`.
    """

    def __init__(self) -> None:
        """Khởi tạo checker (dùng chung instance có cache theo request)."""
        self.permission_checker: PermissionChecker = permission_checker

    def has_perm(self, user_obj: Any, perm: str, obj: Any = None) -> bool:
        """Kiểm tra quyền.

        Args:
            user_obj: Người dùng.
            perm: Mã quyền (`module.resource.action`).
            obj: Không dùng (chưa có object-level permission).

        Returns:
            True nếu có quyền.
        """
        return self.permission_checker.has_permission(user_obj, perm)

    def has_module_perms(self, user_obj: Any, app_label: str) -> bool:
        """Có ít nhất một quyền thuộc module.

        Args:
            user_obj: Người dùng.
            app_label: Mã module.

        Returns:
            True nếu có.
        """
        if getattr(user_obj, "is_active", False) and getattr(user_obj, "is_superuser", False):
            return True
        prefix = f"{app_label}."
        return any(code.startswith(prefix) for code in self.permission_checker.get_permissions(user_obj))
