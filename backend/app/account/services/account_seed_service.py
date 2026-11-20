"""Seed tài khoản cho môi trường local (lệnh `seed_local`)."""

from typing import Any

from django.db import transaction

from app.account.models.user import User
from app.account.repositories.user_repository import UserRepository

SUPERUSER_FLAGS = {"is_staff": True, "is_superuser": True, "is_active": True}


class AccountSeedService:
    """Tạo hoặc cập nhật tài khoản seed; chạy lại nhiều lần vẫn cho cùng kết quả."""

    def __init__(self, repository: UserRepository | None = None) -> None:
        """Khởi tạo service.

        Args:
            repository: Repository người dùng (test có thể truyền bản giả).
        """
        self.repository = repository or UserRepository()

    @transaction.atomic
    def ensure_superuser(self, *, email: str, username: str, password: str) -> tuple[User, bool]:
        """Bảo đảm có superuser với email, username, mật khẩu đã cho.

        Tìm theo email rồi tới username; có thì cập nhật cờ và đặt lại mật khẩu, chưa có thì tạo mới.
        Không kiểm độ mạnh mật khẩu: chỉ dùng cho dữ liệu local.

        Args:
            email: Email đăng nhập.
            username: Tên người dùng.
            password: Mật khẩu thô.

        Returns:
            (Người dùng, True nếu vừa tạo).
        """
        email = email.strip().lower()
        user = self.repository.find_by_email(email) or self.repository.find_by_username(username)
        fields: dict[str, Any] = {"email": email, "username": username, **SUPERUSER_FLAGS}
        if user is None:
            return self.repository.create_user(password=password, **fields), True
        self.repository.update(user, **fields)
        self.repository.set_password(user, password)
        return user, False
