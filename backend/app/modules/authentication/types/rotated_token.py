"""Kết quả xoay vòng refresh token."""

from dataclasses import dataclass

from app.modules.authentication.models.auth_session import AuthSession


@dataclass(frozen=True)
class RotatedToken:
    """Phiên (kèm user) và refresh token thô mới."""

    session: AuthSession
    raw_token: str
