"""Repository phiên đăng nhập (đọc + ghi)."""

from collections.abc import Mapping
from datetime import datetime
from typing import Any

from django.db.models import QuerySet
from django.utils import timezone

from app.core.exceptions.not_found_error import NotFoundError
from app.core.repositories.core_repository import CoreRepository
from app.modules.authentication.models.auth_session import AuthSession


class AuthSessionRepository(CoreRepository[AuthSession]):
    """Truy cập dữ liệu AuthSession."""

    model = AuthSession
    default_ordering = ("-last_used_at", "pk")

    def for_admin(self) -> QuerySet[AuthSession]:
        """Danh sách quản trị kèm người dùng, không gây truy vấn bổ sung khi serialize."""
        return self.get_queryset().select_related("user")

    def user_choices(self) -> QuerySet[AuthSession, Mapping[str, Any]]:
        """Danh mục duy nhất người có phiên chưa xóa; không nạp hồ sơ tài khoản hoặc token."""
        return (
            self.get_queryset()
            .values("user_id", "user__email", "user__username", "user__first_name", "user__last_name")
            .order_by("-user__created_at", "-user_id")
            .distinct()
        )

    def lock_for_admin(self, session_id: Any) -> AuthSession:
        """Khóa phiên và nạp người dùng để kiểm tra quyền thu hồi trong transaction."""
        try:
            return self.for_admin().select_for_update(of=("self",)).get(pk=session_id)
        except AuthSession.DoesNotExist as exc:
            raise NotFoundError("Không tìm thấy phiên.") from exc

    def active(self) -> QuerySet[AuthSession]:
        """Phiên chưa thu hồi và chưa hết hạn.

        Returns:
            QuerySet.
        """
        return self.get_queryset().filter(revoked_at__isnull=True, expires_at__gt=timezone.now())

    def find_active(self, session_id: Any, user_id: Any) -> AuthSession | None:
        """Phiên còn hiệu lực của người dùng, kèm user và ảnh đại diện (một truy vấn; `/auth/me` dùng lại).

        Args:
            session_id: Id phiên (claim `sid`).
            user_id: Id người dùng (claim `sub`).

        Returns:
            Phiên hoặc None.
        """
        return self.active().select_related("user__avatar").filter(pk=session_id, user_id=user_id).first()

    def list_active(self, user: Any) -> list[AuthSession]:
        """Phiên còn hiệu lực của người dùng, mới dùng gần nhất trước.

        Args:
            user: Người dùng.

        Returns:
            Danh sách phiên.
        """
        return list(self.active().filter(user=user).order_by(*self.default_ordering))

    def open(
        self, *, user: Any, expires_at: datetime, user_agent: str, ip_address: str | None
    ) -> AuthSession:
        """Mở phiên mới.

        Args:
            user: Người dùng.
            expires_at: Hết hạn tuyệt đối.
            user_agent: User-Agent.
            ip_address: IP client.

        Returns:
            Phiên đã lưu.
        """
        return self.create(
            user=user,
            expires_at=expires_at,
            last_used_at=timezone.now(),
            user_agent=user_agent[:200],
            ip_address=ip_address or None,
        )

    def lock_with_user(self, session_id: Any) -> AuthSession:
        """Khóa dòng phiên (token family) kèm user để tuần tự hóa refresh đồng thời.

        Args:
            session_id: Id phiên.

        Returns:
            Phiên đã khóa.
        """
        return AuthSession.objects.select_for_update().select_related("user").get(pk=session_id)

    def revoke(self, session: AuthSession, reason: str) -> None:
        """Thu hồi một phiên đã nạp.

        Args:
            session: Phiên.
            reason: Lý do.
        """
        self.update(session, revoked_at=timezone.now(), revoked_reason=reason)

    def touch(self, session: AuthSession) -> None:
        """Cập nhật thời điểm dùng gần nhất.

        Args:
            session: Phiên.
        """
        self.update(session, last_used_at=timezone.now())

    def revoke_where(self, reason: str, **filters: Any) -> int:
        """Thu hồi các phiên còn hiệu lực khớp điều kiện.

        Args:
            reason: Lý do.
            **filters: Điều kiện.

        Returns:
            Số phiên đã thu hồi.
        """
        return self.update_where(
            {"revoked_at": timezone.now(), "revoked_reason": reason}, revoked_at__isnull=True, **filters
        )

    def delete_expired_before(self, moment: Any) -> int:
        """Xóa cứng phiên đã hết hạn hoặc bị thu hồi trước mốc (refresh token xóa theo CASCADE).

        Args:
            moment: Mốc thời gian.

        Returns:
            Số phiên đã xóa.
        """
        expired = self.hard_delete_where(expires_at__lt=moment)
        return expired + self.hard_delete_where(revoked_at__lt=moment)
