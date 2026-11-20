"""Authentication backend Django: xác thực email hoặc tên người dùng + mật khẩu qua UserService."""

from typing import Any

from django.contrib.auth.backends import BaseBackend
from django.http import HttpRequest

from app.account.models.user import User
from app.account.services.user_service import UserService


class AccountAuthBackend(BaseBackend):
    """Nguồn người dùng cho `django.contrib.auth` (authenticate, get_user).

    Quyền (`has_perm`) do `IamPermissionBackend` của module IAM đảm nhận.
    Django tạo instance backend mỗi lần dùng nên service khởi tạo trong `__init__` là an toàn.
    """

    def __init__(self) -> None:
        """Khởi tạo service."""
        self.user_service = UserService()

    def authenticate(
        self,
        request: HttpRequest | None,
        username: str | None = None,
        password: str | None = None,
        **kwargs: Any,
    ) -> User | None:
        """Xác thực tài khoản (email hoặc tên người dùng) + mật khẩu.

        Args:
            request: HTTP request.
            username: Email hoặc tên người dùng (Django truyền qua `username`, có thể là `email`).
            password: Mật khẩu thô.
            **kwargs: Có thể chứa `email`.

        Returns:
            Người dùng hợp lệ (kể cả bị khóa; nơi gọi tự kiểm tra is_active) hoặc None.
        """
        identifier = kwargs.get("email") or username or ""
        if not identifier or password is None:
            return None
        return self.user_service.authenticate_credentials(identifier, password)

    def get_user(self, user_id: Any) -> User | None:
        """Lấy người dùng theo id.

        Args:
            user_id: Id.

        Returns:
            Người dùng hoặc None.
        """
        return self.user_service.find_by_id(user_id)
