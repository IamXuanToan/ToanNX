"""Repository người dùng (đọc + ghi)."""

from typing import Any

from django.db.models import Prefetch, Q, QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.system.models.user import User
from app.system.models.user_social_account import UserSocialAccount


class UserRepository(CoreRepository[User]):
    """Truy cập dữ liệu người dùng."""

    model = User

    def get_queryset(self) -> QuerySet[User]:
        """Người dùng chưa xóa mềm, kèm ảnh đại diện và tài khoản mạng xã hội (tránh N+1).

        Returns:
            QuerySet.
        """
        return (
            super()
            .get_queryset()
            .select_related("avatar")
            .prefetch_related(
                Prefetch(
                    "social_accounts",
                    queryset=UserSocialAccount.objects.filter(deleted_at__isnull=True),
                )
            )
        )

    def find_by_email(self, email: str) -> User | None:
        """Tìm người dùng (kể cả bị khóa) theo email đã chuẩn hóa.

        Args:
            email: Email chữ thường.

        Returns:
            Người dùng hoặc None.
        """
        return self.find_one(email=email)

    def find_by_username(self, username: str) -> User | None:
        """Tìm người dùng (kể cả bị khóa) theo tên người dùng (khớp chính xác).

        Args:
            username: Tên người dùng.

        Returns:
            Người dùng hoặc None.
        """
        return self.find_one(username=username)

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
        user.last_seen_at = when
        self.save(user, update_fields=["last_login", "last_seen_at"])

    def touch_last_seen(self, user: User, when: Any) -> None:
        """Ghi thời điểm hoạt động gần nhất (không đổi `updated_at`/`updated_by`).

        Args:
            user: Người dùng.
            when: Thời điểm.
        """
        user.last_seen_at = when
        self.save(user, update_fields=["last_seen_at"])

    def active_with_permission(self, code: str | None) -> QuerySet[User]:
        """Người dùng đang hoạt động có quyền `code` qua vai trò đang bật (superuser luôn có).

        Args:
            code: Mã quyền; None = mọi người dùng đang hoạt động.

        Returns:
            QuerySet không trùng.
        """
        queryset = self.get_queryset().filter(is_active=True)
        if code is None:
            return queryset
        return queryset.filter(
            Q(is_superuser=True)
            | Q(
                user_roles__role__is_active=True,
                user_roles__role__deleted_at__isnull=True,
                user_roles__role__role_permissions__permission__code=code,
                user_roles__role__role_permissions__permission__is_active=True,
            )
        ).distinct()

    def active_in_roles(self, role_ids: list[Any]) -> QuerySet[User]:
        """Người dùng đang hoạt động thuộc một trong các vai trò."""
        return self.get_queryset().filter(is_active=True, user_roles__role_id__in=role_ids).distinct()

    def lock_active_superusers(self) -> list[User]:
        """Khóa dòng mọi superuser đang hoạt động (chống race khi hạ quyền đồng thời).

        Returns:
            Danh sách superuser đang hoạt động.
        """
        return list(User.objects.alive().select_for_update().filter(is_superuser=True, is_active=True))

    def find_email_by_id(self, user_id: Any) -> str:
        """Lấy email của người dùng theo khóa chính (phục vụ ghi nhật ký).

        Args:
            user_id: Id người dùng.

        Returns:
            Email hoặc chuỗi rỗng nếu không tìm thấy.
        """
        email = self.model._default_manager.filter(pk=user_id).values_list("email", flat=True).first()
        return str(email or "")
