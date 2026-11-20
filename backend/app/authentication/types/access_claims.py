"""Claims đã xác minh của access token."""

from dataclasses import dataclass


@dataclass(frozen=True)
class AccessClaims:
    """Người dùng và phiên mà access token đại diện."""

    user_id: str
    session_id: str
