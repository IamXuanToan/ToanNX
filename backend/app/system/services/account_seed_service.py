"""Seed tài khoản cho môi trường local (lệnh `seed_local`)."""

from typing import Any

from django.db import transaction

from app.system.models.user import User
from app.system.repositories.role_repository import RoleRepository
from app.system.repositories.user_repository import UserRepository
from app.system.repositories.user_role_repository import UserRoleRepository

SUPERUSER_FLAGS = {"is_staff": True, "is_superuser": True, "is_active": True}


class AccountSeedService:
    """Tạo hoặc cập nhật tài khoản seed; chạy lại nhiều lần vẫn cho cùng kết quả."""

    def __init__(
        self,
        repository: UserRepository | None = None,
        role_repository: RoleRepository | None = None,
        user_role_repository: UserRoleRepository | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            repository: Repository người dùng (test có thể truyền bản giả).
            role_repository: Repository vai trò.
            user_role_repository: Repository gán vai trò.
        """
        self.repository = repository or UserRepository()
        self.role_repository = role_repository or RoleRepository()
        self.user_role_repository = user_role_repository or UserRoleRepository()

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

    @transaction.atomic
    def ensure_user_with_roles(
        self,
        *,
        email: str,
        username: str,
        password: str,
        full_name: str,
        is_staff: bool,
        role_codes: list[str],
    ) -> tuple[User, bool]:
        """Tạo/cập nhật tài khoản thử nghiệm theo bộ vai trò IAM (không bật superuser)."""
        normalized_email = email.strip().lower()
        user = self.repository.find_by_email(normalized_email) or self.repository.find_by_username(username)
        fields: dict[str, Any] = {
            "email": normalized_email,
            "username": username,
            "full_name": full_name,
            "is_staff": is_staff,
            "is_superuser": False,
            "is_active": True,
            "is_verified": True,
        }
        if user is None:
            user = self.repository.create_user(password=password, **fields)
            created = True
        else:
            self.repository.update(user, **fields)
            self.repository.set_password(user, password)
            created = False

        self.user_role_repository.hard_delete_where(user_id=user.pk)
        for code in role_codes:
            role = self.role_repository.find_one(code=code)
            if role is None:
                raise ValueError(f"Không tìm thấy vai trò {code}. Hãy chạy seed_roles trước.")
            self.user_role_repository.create(user=user, role=role)
        return user, created
