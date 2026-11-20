"""Manager tạo người dùng (dùng bởi repository và `createsuperuser`)."""

from typing import TYPE_CHECKING, Any

from django.contrib.auth.base_user import BaseUserManager

from app.core.models.core_query_set import CoreQuerySet

if TYPE_CHECKING:
    from app.system.models.user import User


class UserManager(BaseUserManager["User"]):
    """Manager của User: email không phân biệt hoa thường, tạo user/superuser."""

    def get_queryset(self) -> CoreQuerySet["User"]:
        """Queryset có tiện ích `alive()`."""
        return CoreQuerySet(self.model, using=self._db)

    def alive(self) -> CoreQuerySet["User"]:
        """Người dùng chưa bị xóa mềm.

        Returns:
            QuerySet.
        """
        return self.get_queryset().alive()

    def get_by_natural_key(self, username: str | None) -> "User":
        """Tìm theo email, không phân biệt hoa thường.

        Args:
            username: Email.

        Returns:
            Người dùng.
        """
        return self.get(email=(username or "").strip().lower())

    def create_user(self, email: str, password: str | None = None, **extra_fields: Any) -> "User":
        """Tạo người dùng thường.

        Args:
            email: Email đăng nhập.
            password: Mật khẩu thô; None thì đặt mật khẩu không dùng được.
            **extra_fields: Field bổ sung.

        Returns:
            Người dùng đã lưu.

        Raises:
            ValueError: Khi thiếu email.
        """
        if not email:
            raise ValueError("Email là bắt buộc.")
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str | None = None, **extra_fields: Any) -> "User":
        """Tạo superuser (is_staff, is_superuser, is_active đều True).

        Args:
            email: Email.
            password: Mật khẩu thô.
            **extra_fields: Field bổ sung.

        Returns:
            Superuser đã lưu.

        Raises:
            ValueError: Khi cờ bắt buộc bị đặt sai.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        for flag in ("is_staff", "is_superuser", "is_active"):
            if extra_fields[flag] is not True:
                raise ValueError(f"Superuser phải có {flag}=True.")
        return self.create_user(email, password, **extra_fields)
