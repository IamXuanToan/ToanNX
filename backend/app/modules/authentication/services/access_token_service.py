"""Phát hành/xác minh access token JWT (HS256) gắn với phiên."""

import uuid
from datetime import datetime, timedelta
from typing import Any

import jwt
from django.conf import settings
from django.utils import timezone

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.authentication_error import AuthenticationError
from app.modules.authentication.types.access_claims import AccessClaims

_ACCESS_TYPE = "access"


class AccessTokenService:
    """Access token ngắn hạn; claim `sid` cho phép thu hồi ngay khi phiên bị revoke."""

    def issue(self, user_id: Any, session_id: Any) -> tuple[str, datetime]:
        """Phát hành access token.

        Args:
            user_id: Id người dùng.
            session_id: Id phiên.

        Returns:
            (token, thời điểm hết hạn).
        """
        now = timezone.now()
        expires_at = now + timedelta(seconds=settings.AUTH_ACCESS_TOKEN_LIFETIME_SECONDS)
        payload = {
            "sub": str(user_id),
            "sid": str(session_id),
            "jti": uuid.uuid4().hex,
            "typ": _ACCESS_TYPE,
            "iat": int(now.timestamp()),
            "exp": int(expires_at.timestamp()),
            "iss": settings.JWT_ISSUER,
            "aud": settings.JWT_AUDIENCE,
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return token, expires_at

    def decode(self, token: str) -> AccessClaims:
        """Xác minh chữ ký, thời hạn, issuer, audience và loại token.

        Args:
            token: Chuỗi JWT.

        Returns:
            Claims.

        Raises:
            AuthenticationError: AUTH_TOKEN_EXPIRED hoặc AUTH_TOKEN_INVALID.
        """
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
                audience=settings.JWT_AUDIENCE,
                issuer=settings.JWT_ISSUER,
                options={"require": ["exp", "iat", "sub", "sid", "typ"]},
            )
        except jwt.ExpiredSignatureError as exc:
            raise AuthenticationError(
                "Phiên truy cập đã hết hạn.", code=ErrorCode.AUTH_TOKEN_EXPIRED
            ) from exc
        except jwt.PyJWTError as exc:
            raise AuthenticationError("Token không hợp lệ.", code=ErrorCode.AUTH_TOKEN_INVALID) from exc
        if payload["typ"] != _ACCESS_TYPE:
            raise AuthenticationError("Token không hợp lệ.", code=ErrorCode.AUTH_TOKEN_INVALID)
        return AccessClaims(user_id=str(payload["sub"]), session_id=str(payload["sid"]))
