"""Repository người dùng (đọc + ghi)."""

from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.modules.account.models.user import User


class UserRepository(CoreRepository[User]):
    """Truy cập dữ liệu người dùng."""

    model = User

    def get_queryset(self) -> QuerySet[User]:
        """Người dùng chưa xóa mềm, kèm ảnh đại diện (tránh N+1 khi serialize).

        Returns:
            QuerySet.
        """
        return User.objects.alive().select_related("avatar")

    def find_by_email(self, email: str) -> User | None:
        """Tìm người dùng (kể cả bị khóa) theo email đã chuẩn hóa.

        Args:
            email: Email chữ thường.

        Returns:
            Người dùng hoặc None.
        """
        return self.find_one(email=email)

    def create_user(self, *, password: str, actor: Any | None = None, **fields: Any) -> User:
        """Tạo người dùng với mật khẩu đã băm.

        Args:
            password: Mật khẩu thô (đã kiểm tra độ mạnh).
            actor: Người thực hiện.
            **fields: Field khác.

        Returns:
            Người dùng đã lưu.
        """
        user = User(**fields)
        user.set_password(password)
        self.apply_audit(user, actor, created=True)
        self.save(user)
        return user

    def set_password(self, user: User, password: str, *, actor: Any | None = None) -> None:
        """Đổi mật khẩu.

        Args:
            user: Người dùng.
            password: Mật khẩu thô.
            actor: Người thực hiện.
        """
        user.set_password(password)
        audit_fields = self.apply_audit(user, actor, created=False)
        self.save(user, update_fields=["password", *audit_fields])

    def touch_last_login(self, user: User, when: Any) -> None:
        """Ghi thời điểm đăng nhập gần nhất.

        Args:
            user: Người dùng.
            when: Thời điểm.
        """
        user.last_login = when
        self.save(user, update_fields=["last_login"])

    def lock_active_superusers(self) -> list[User]:
        """Khóa dòng mọi superuser đang hoạt động (chống race khi hạ quyền đồng thời).

        Returns:
            Danh sách superuser đang hoạt động.
        """
        return list(User.objects.select_for_update().filter(is_superuser=True, is_active=True))
