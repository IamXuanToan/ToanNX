"""Tạo chữ ký giống QStash (JWT HS256) cho test."""

import base64
import hashlib
import time

import jwt

DISPATCH_URL = "https://api.toannx.com/api/v1/system/notifications/dispatch"


def sign(key: str, body: bytes, sub: str = DISPATCH_URL, exp_offset: int = 300) -> str:
    """Chữ ký `Upstash-Signature` cho `body`.

    Args:
        key: Signing key.
        body: Body thô.
        sub: URL đích (claim `sub`).
        exp_offset: Hạn so với hiện tại (giây, âm = đã hết hạn).

    Returns:
        JWT.
    """
    now = int(time.time())
    digest = base64.urlsafe_b64encode(hashlib.sha256(body).digest()).decode().rstrip("=")
    claims = {"iss": "Upstash", "sub": sub, "exp": now + exp_offset, "nbf": now - 1, "body": digest}
    return jwt.encode(claims, key, algorithm="HS256")
