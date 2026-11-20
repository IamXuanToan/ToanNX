"""Nghiệp vụ đăng nhập và làm mới phiên (không có đăng ký công khai)."""

import logging
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate
from django.db import transaction
from django.http import HttpRequest
from django.utils import timezone

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.authentication_error import AuthenticationError
from app.system.models.auth_session import AuthSession
from app.system.models.user import User
from app.system.repositories.auth_session_repository import AuthSessionRepository
from app.system.services.access_token_service import AccessTokenService
from app.system.services.current_user_service import CurrentUserService
from app.system.services.rate_limit_service import RateLimitService
from app.system.services.refresh_token_service import RefreshTokenService
from app.system.services.user_service import UserService
from app.system.types.auth_result import AuthResult
from app.system.utils.client_ip import get_client_ip

logger = logging.getLogger("app.auth")

_REFRESH_RATE_LIMIT = 30
_REFRESH_RATE_WINDOW_SECONDS = 60


class AuthService:
    """Điều phối đăng nhập và refresh."""

    def __init__(
        self,
        auth_session_repository: AuthSessionRepository | None = None,
        refresh_token_service: RefreshTokenService | None = None,
        access_token_service: AccessTokenService | None = None,
        rate_limit_service: RateLimitService | None = None,
        user_service: UserService | None = None,
        current_user_service: CurrentUserService | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            auth_session_repository: Repository phiên.
            refresh_token_service: Service refresh token.
            access_token_service: Service access token.
            rate_limit_service: Service rate limit.
            user_service: Service người dùng.
            current_user_service: Service hồ sơ người dùng hiện tại.
        """
        self.auth_session_repository = auth_session_repository or AuthSessionRepository()
        self.refresh_token_service = refresh_token_service or RefreshTokenService()
        self.access_token_service = access_token_service or AccessTokenService()
        self.rate_limit_service = rate_limit_service or RateLimitService()
        self.user_service = user_service or UserService()
        self.current_user_service = current_user_service or CurrentUserService(user_service=self.user_service)

    def login(self, request: HttpRequest, identifier: str, password: str) -> AuthResult:
        """Đăng nhập bằng email hoặc tên người dùng + mật khẩu.

        Args:
            request: HTTP request (để lấy IP/User-Agent).
            identifier: Email hoặc tên người dùng.
            password: Mật khẩu.

        Returns:
            Kết quả để đặt cookie và trả hồ sơ.

        Raises:
            RateLimitError: Thử quá nhiều lần.
            AuthenticationError: Sai thông tin hoặc tài khoản bị khóa.
        """
        # ============================================================
        # BƯỚC 1: Rate limit theo tài khoản + IP
        # ============================================================
        normalized = identifier.strip().lower()
        ip = get_client_ip(request)
        limit_key = f"login:{normalized}:{ip}"
        window = settings.AUTH_LOGIN_RATE_WINDOW_SECONDS
        self.rate_limit_service.hit(limit_key, settings.AUTH_LOGIN_RATE_LIMIT, window)

        # ============================================================
        # BƯỚC 2: Xác thực (qua Django backend → UserService)
        # ============================================================
        user = authenticate(request, username=identifier.strip(), password=password)
        if not isinstance(user, User) or user.deleted_at is not None:
            logger.info("Đăng nhập thất bại")
            raise AuthenticationError(
                "Tài khoản hoặc mật khẩu không đúng.", code=ErrorCode.AUTH_INVALID_CREDENTIALS
            )
        if not user.is_active:
            raise AuthenticationError("Tài khoản đã bị khóa.", code=ErrorCode.AUTH_USER_INACTIVE)
        self.rate_limit_service.reset(limit_key, window)

        # ============================================================
        # BƯỚC 3: Mở phiên, phát token
        # ============================================================
        with transaction.atomic():
            session = self.auth_session_repository.open(
                user=user,
                expires_at=timezone.now() + timedelta(seconds=settings.AUTH_REFRESH_TOKEN_LIFETIME_SECONDS),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
                ip_address=ip,
            )
            refresh_raw = self.refresh_token_service.issue(session)
            self.user_service.record_login(user)
        return self._build_result(session, refresh_raw)

    def refresh(self, request: HttpRequest, raw_token: str) -> AuthResult:
        """Làm mới phiên (rate limit theo IP).

        Args:
            request: HTTP request.
            raw_token: Refresh token thô từ cookie.

        Returns:
            Kết quả mới để đặt cookie và trả hồ sơ.
        """
        self.rate_limit_service.hit(
            f"refresh:{get_client_ip(request)}", _REFRESH_RATE_LIMIT, _REFRESH_RATE_WINDOW_SECONDS
        )
        rotated = self.refresh_token_service.rotate(raw_token)
        return self._build_result(rotated.session, rotated.raw_token)

    def _build_result(self, session: AuthSession, refresh_raw: str) -> AuthResult:
        """Phát access token và dựng hồ sơ người dùng hiện tại."""
        access, access_expires = self.access_token_service.issue(session.user_id, session.pk)
        return AuthResult(
            session=session,
            access_token=access,
            access_expires_at=access_expires,
            refresh_token=refresh_raw,
            profile=self.current_user_service.get_profile_by_id(session.user_id),
        )
