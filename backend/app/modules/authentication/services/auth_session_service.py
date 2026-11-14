"""Nghiệp vụ phiên đăng nhập: xác thực access token, liệt kê, thu hồi, đăng xuất."""

from typing import Any

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.authentication_error import AuthenticationError
from app.core.exceptions.not_found_error import NotFoundError
from app.modules.authentication.models.auth_session import AuthSession
from app.modules.authentication.repositories.auth_session_repository import AuthSessionRepository
from app.modules.authentication.repositories.refresh_token_repository import RefreshTokenRepository
from app.modules.authentication.services.access_token_service import AccessTokenService
from app.modules.authentication.services.refresh_token_service import RefreshTokenService


class AuthSessionService:
    """Nghiệp vụ AuthSession."""

    def __init__(
        self,
        repository: AuthSessionRepository | None = None,
        refresh_token_repository: RefreshTokenRepository | None = None,
        access_token_service: AccessTokenService | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            repository: Repository phiên.
            refresh_token_repository: Repository refresh token.
            access_token_service: Service access token.
        """
        self.repository = repository or AuthSessionRepository()
        self.refresh_token_repository = refresh_token_repository or RefreshTokenRepository()
        self.access_token_service = access_token_service or AccessTokenService()

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
        return session

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
        token = self.refresh_token_repository.find_by_hash(RefreshTokenService.hash_token(raw_refresh_token))
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
