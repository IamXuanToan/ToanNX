"""Nghiệp vụ phiên đăng nhập: xác thực access token, liệt kê, thu hồi, đăng xuất."""

from datetime import timedelta
from typing import Any

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.authentication_error import AuthenticationError
from app.core.exceptions.not_found_error import NotFoundError
from app.system.models.auth_session import AuthSession
from app.system.repositories.auth_session_repository import AuthSessionRepository
from app.system.repositories.refresh_token_repository import RefreshTokenRepository
from app.system.services.access_token_service import AccessTokenService
from app.system.services.rate_limit_service import RateLimitService
from app.system.services.refresh_token_service import RefreshTokenService
from app.system.services.user_service import UserService

# Ghi hoạt động (phiên + người dùng) tối đa một lần mỗi khoảng này cho mỗi phiên.
ACTIVITY_TOUCH_INTERVAL = timedelta(minutes=1)


class AuthSessionService:
    """Nghiệp vụ AuthSession."""

    def __init__(
        self,
        repository: AuthSessionRepository | None = None,
        refresh_token_repository: RefreshTokenRepository | None = None,
        access_token_service: AccessTokenService | None = None,
        user_service: UserService | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            repository: Repository phiên.
            refresh_token_repository: Repository refresh token.
            access_token_service: Service access token.
            user_service: Service người dùng (ghi hoạt động gần nhất).
        """
        self.repository = repository or AuthSessionRepository()
        self.refresh_token_repository = refresh_token_repository or RefreshTokenRepository()
        self.access_token_service = access_token_service or AccessTokenService()
        self.user_service = user_service or UserService()
        self.refresh_token_service = RefreshTokenService()
        self.rate_limit_service = RateLimitService()

    @transaction.atomic
    def purge_expired_auth(self) -> int:
        """Xóa bucket rate limit hết hạn và phiên hết hạn/thu hồi quá `AUTH_EXPIRED_RETENTION_DAYS`.

        Returns:
            Tổng số bản ghi đã xóa.
        """
        now = timezone.now()
        buckets = self.rate_limit_service.purge_expired(now)
        moment = now - timedelta(days=settings.AUTH_EXPIRED_RETENTION_DAYS)
        return buckets + self.repository.delete_expired_before(moment)

    def authenticate_access_token(self, token: str) -> AuthSession:
        """Xác minh access token và phiên còn hiệu lực (logout/khóa có hiệu lực ngay).

        Args:
            token: Access JWT.

        Returns:
            Phiên kèm user.

        Raises:
            AuthenticationError: Token sai/hết hạn, phiên thu hồi, tài khoản bị khóa.
        """
        claims = self.access_token_service.decode(token)
        session = self.repository.find_active(claims.session_id, claims.user_id)
        if session is None:
            raise AuthenticationError(
                "Phiên đăng nhập không còn hiệu lực.", code=ErrorCode.AUTH_SESSION_INVALID
            )
        if not session.user.is_active or session.user.deleted_at is not None:
            raise AuthenticationError("Tài khoản đã bị khóa.", code=ErrorCode.AUTH_USER_INACTIVE)
        self._record_activity(session)
        return session

    def _record_activity(self, session: AuthSession) -> None:
        """Cập nhật lần dùng gần nhất của phiên và người dùng, tối đa mỗi `ACTIVITY_TOUCH_INTERVAL`."""
        now = timezone.now()
        if session.last_used_at is not None and now - session.last_used_at < ACTIVITY_TOUCH_INTERVAL:
            return
        self.repository.touch(session)
        self.user_service.record_activity(session.user)

    def list_sessions(self, user: Any) -> list[AuthSession]:
        """Phiên còn hiệu lực của người dùng.

        Args:
            user: Người dùng.

        Returns:
            Danh sách phiên.
        """
        return self.repository.list_active(user)

    def revoke_session(self, user: Any, session_id: Any) -> None:
        """Thu hồi một phiên của chính người dùng.

        Args:
            user: Người dùng.
            session_id: Id phiên.

        Raises:
            NotFoundError: Phiên không tồn tại hoặc không thuộc người dùng.
        """
        if self.repository.revoke_where("user_revoked", pk=session_id, user=user) == 0:
            raise NotFoundError("Không tìm thấy phiên.")

    def logout(self, raw_refresh_token: str) -> None:
        """Thu hồi phiên ứng với refresh token (bỏ qua nếu token không hợp lệ).

        Args:
            raw_refresh_token: Refresh token thô từ cookie.
        """
        if not raw_refresh_token:
            return
        token = self.refresh_token_repository.find_by_hash(
            self.refresh_token_service.hash_token(raw_refresh_token)
        )
        if token is not None:
            self.repository.revoke_where("logout", pk=token.session_id)

    def revoke_all(self, user: Any, reason: str) -> int:
        """Thu hồi mọi phiên còn hiệu lực (logout-all, đổi mật khẩu, khóa tài khoản).

        Args:
            user: Người dùng.
            reason: Lý do.

        Returns:
            Số phiên đã thu hồi.
        """
        return self.repository.revoke_where(reason, user=user)
