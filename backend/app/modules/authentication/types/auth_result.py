"""Kết quả đăng nhập/refresh: dữ liệu để đặt cookie và trả response."""

from dataclasses import dataclass
from datetime import datetime

from app.modules.authentication.models.auth_session import AuthSession
from app.modules.authentication.types.current_user_profile import CurrentUserProfile


@dataclass(frozen=True)
class AuthResult:
    """Phiên mới, token và hồ sơ người dùng hiện tại."""

    session: AuthSession
    access_token: str
    access_expires_at: datetime
    refresh_token: str
    profile: CurrentUserProfile
