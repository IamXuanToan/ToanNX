"""Đặt/xóa cookie xác thực.

- Access token: HttpOnly, path `/api`, sống bằng thời hạn access token.
- Refresh token: HttpOnly, SameSite=Strict, path `/api/v1/auth` (chỉ gửi tới endpoint auth).
- Session hint: HttpOnly, path `/`, giá trị "1"; chỉ để Next.js proxy kiểm tra lạc quan.
Cookie host-only (không đặt Domain) vì frontend gọi API cùng origin qua rewrite.
"""

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone

from app.authentication.types.auth_result import AuthResult


class AuthCookieService:
    """Ghi/xóa bộ cookie phiên trên response."""

    @staticmethod
    def set_cookies(response: HttpResponse, result: AuthResult) -> None:
        """Gắn cookie phiên đăng nhập vào response.

        Args:
            response: Response.
            result: Kết quả đăng nhập/refresh.
        """
        now = timezone.now()
        secure = settings.AUTH_COOKIE_SECURE
        session_max_age = max(0, int((result.session.expires_at - now).total_seconds()))
        access_max_age = max(0, int((result.access_expires_at - now).total_seconds()))

        response.set_cookie(
            settings.AUTH_ACCESS_COOKIE_NAME,
            result.access_token,
            max_age=access_max_age,
            path=settings.AUTH_ACCESS_COOKIE_PATH,
            secure=secure,
            httponly=True,
            samesite="Lax",
        )

        response.set_cookie(
            settings.AUTH_REFRESH_COOKIE_NAME,
            result.refresh_token,
            max_age=session_max_age,
            path=settings.AUTH_REFRESH_COOKIE_PATH,
            secure=secure,
            httponly=True,
            samesite="Strict",
        )

        response.set_cookie(
            settings.AUTH_SESSION_HINT_COOKIE_NAME,
            "1",
            max_age=session_max_age,
            path="/",
            secure=secure,
            httponly=True,
            samesite="Lax",
        )

    @staticmethod
    def clear_cookies(response: HttpResponse) -> None:
        """Xóa toàn bộ cookie phiên đăng nhập.

        Args:
            response: Response.
        """
        response.delete_cookie(
            settings.AUTH_ACCESS_COOKIE_NAME, path=settings.AUTH_ACCESS_COOKIE_PATH, samesite="Lax"
        )
        response.delete_cookie(
            settings.AUTH_REFRESH_COOKIE_NAME, path=settings.AUTH_REFRESH_COOKIE_PATH, samesite="Strict"
        )
        response.delete_cookie(settings.AUTH_SESSION_HINT_COOKIE_NAME, path="/", samesite="Lax")
