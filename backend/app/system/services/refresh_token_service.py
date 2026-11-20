"""Phát hành và xoay vòng refresh token.

Token đã xoay vòng bị dùng lại:
- Trong `AUTH_REFRESH_REUSE_GRACE_SECONDS` và token kế tiếp vẫn là token hiện hành:
  coi là request đồng thời (nhiều tab) → 409, không thu hồi.
- Ngoài ra: coi là bị đánh cắp → thu hồi toàn bộ phiên.
"""

import hashlib
import hmac
import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.app_exception import AppException
from app.core.exceptions.authentication_error import AuthenticationError
from app.core.exceptions.conflict_error import ConflictError
from app.system.models.auth_session import AuthSession
from app.system.models.refresh_token import RefreshToken
from app.system.repositories.auth_session_repository import AuthSessionRepository
from app.system.repositories.refresh_token_repository import RefreshTokenRepository
from app.system.types.rotated_token import RotatedToken

logger = logging.getLogger("app.auth")

_REFRESH_TOKEN_BYTES = 48


class RefreshTokenService:
    """Nghiệp vụ RefreshToken."""

    def __init__(
        self,
        repository: RefreshTokenRepository | None = None,
        auth_session_repository: AuthSessionRepository | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            repository: Repository refresh token.
            auth_session_repository: Repository phiên.
        """
        self.repository = repository or RefreshTokenRepository()
        self.auth_session_repository = auth_session_repository or AuthSessionRepository()

    @staticmethod
    def hash_token(raw: str) -> str:
        """Băm refresh token bằng HMAC-SHA256 với SECRET_KEY.

        Args:
            raw: Token thô.

        Returns:
            Chuỗi hex 64 ký tự.
        """
        return hmac.new(settings.SECRET_KEY.encode(), raw.encode(), hashlib.sha256).hexdigest()

    def issue(self, session: AuthSession) -> str:
        """Tạo refresh token ngẫu nhiên 384-bit cho phiên (chỉ lưu hash).

        Args:
            session: Phiên.

        Returns:
            Token thô gửi cho client.
        """
        raw = secrets.token_urlsafe(_REFRESH_TOKEN_BYTES)
        self.repository.issue(session, self.hash_token(raw))
        return raw

    def rotate(self, raw_token: str) -> RotatedToken:
        """Xoay vòng refresh token.

        Args:
            raw_token: Refresh token thô từ cookie.

        Returns:
            Phiên và refresh token mới.

        Raises:
            AuthenticationError: Token sai/hết hạn/bị thu hồi/bị dùng lại.
            ConflictError: AUTH_REFRESH_CONFLICT khi refresh đồng thời.
        """
        # ============================================================
        # BƯỚC 1-2: Kiểm tra token có mặt và tìm bản ghi theo hash
        # ============================================================
        if not raw_token:
            raise AuthenticationError("Thiếu refresh token.", code=ErrorCode.AUTH_REFRESH_INVALID)
        record = self.repository.find_by_hash(self.hash_token(raw_token))
        if record is None:
            raise AuthenticationError("Refresh token không hợp lệ.", code=ErrorCode.AUTH_REFRESH_INVALID)

        failure: AppException | None = None
        result: RotatedToken | None = None
        with transaction.atomic():
            # ============================================================
            # BƯỚC 3: Khóa phiên (token family) để tuần tự hóa refresh đồng thời
            # ============================================================
            session = self.auth_session_repository.lock_with_user(record.session_id)
            token = self.repository.lock(record.pk)
            now = timezone.now()

            # ============================================================
            # BƯỚC 4-5: Thu hồi / dùng lại / hết hạn / tài khoản bị khóa
            # ============================================================
            if session.revoked_at is not None:
                failure = AuthenticationError("Phiên đã bị thu hồi.", code=ErrorCode.AUTH_REFRESH_REVOKED)
            elif token.rotated_at is not None:
                failure = self._handle_reuse(session, token)
            elif token.expires_at <= now or session.expires_at <= now:
                self.auth_session_repository.revoke(session, "expired")
                failure = AuthenticationError("Phiên đã hết hạn.", code=ErrorCode.AUTH_REFRESH_EXPIRED)
            elif not session.user.is_active or session.user.deleted_at is not None:
                self.auth_session_repository.revoke(session, "user_inactive")
                failure = AuthenticationError("Tài khoản đã bị khóa.", code=ErrorCode.AUTH_USER_INACTIVE)
            else:
                # ============================================================
                # BƯỚC 6-8: Thu hồi token cũ, phát token mới, lưu trạng thái
                # ============================================================
                raw = secrets.token_urlsafe(_REFRESH_TOKEN_BYTES)
                new_token = self.repository.issue(session, self.hash_token(raw))
                self.repository.mark_rotated(token, new_token)
                self.auth_session_repository.touch(session)
                result = RotatedToken(session=session, raw_token=raw)

        # Raise sau khi transaction commit để việc thu hồi phiên (reuse/expired) được lưu.
        if failure is not None:
            raise failure
        if result is None:  # pragma: no cover - không thể xảy ra theo luồng trên
            raise AuthenticationError(code=ErrorCode.AUTH_REFRESH_INVALID)
        # ============================================================
        # BƯỚC 9: Trả phiên mới
        # ============================================================
        return result

    def _handle_reuse(self, session: AuthSession, token: RefreshToken) -> AppException:
        """Phân biệt refresh đồng thời và tái sử dụng token bị đánh cắp."""
        grace = timedelta(seconds=settings.AUTH_REFRESH_REUSE_GRACE_SECONDS)
        within_grace = token.rotated_at is not None and timezone.now() - token.rotated_at <= grace
        successor_is_current = token.replaced_by_id is not None and self.repository.is_current(
            token.replaced_by_id
        )
        if within_grace and successor_is_current:
            return ConflictError(
                "Phiên vừa được làm mới, vui lòng thử lại.", code=ErrorCode.AUTH_REFRESH_CONFLICT
            )

        logger.warning("Phát hiện tái sử dụng refresh token, thu hồi phiên %s", session.pk)
        self.auth_session_repository.revoke(session, "reuse_detected")
        return AuthenticationError(
            "Phiên không còn an toàn, vui lòng đăng nhập lại.", code=ErrorCode.AUTH_REFRESH_REUSED
        )
