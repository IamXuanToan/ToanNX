"""DRF authentication: access JWT từ cookie (kèm CSRF) hoặc header Bearer."""

from typing import Any

from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.request import Request

from app.core.context.user_context import set_current_user
from app.core.security.csrf import enforce_csrf
from app.system.models.auth_session import AuthSession
from app.system.services.auth_session_service import AuthSessionService


class CookieJwtAuthentication(BaseAuthentication):
    """Xác thực bằng access JWT.

    - Nguồn token: header `Authorization: Bearer` (không cần CSRF) hoặc cookie
      `access_token` (bắt buộc CSRF cho phương thức thay đổi trạng thái).
    - Kiểm tra token + phiên ủy quyền cho AuthSessionService.
    """

    def __init__(self) -> None:
        """Khởi tạo service (rule backend §5.2: tạo ở `__init__`, không tạo trong method)."""
        self.auth_session_service = AuthSessionService()

    def authenticate(self, request: Request) -> tuple[Any, AuthSession] | None:
        """Xác thực request.

        Args:
            request: DRF request.

        Returns:
            (user, session) hoặc None nếu không có token.

        Raises:
            AuthenticationError: Token/phiên không hợp lệ.
            AuthorizationError: AUTH_CSRF_FAILED.
        """
        header = request.META.get("HTTP_AUTHORIZATION", "")
        if header.startswith("Bearer "):
            token, via_cookie = header.removeprefix("Bearer ").strip(), False
        else:
            token, via_cookie = request.COOKIES.get(settings.AUTH_ACCESS_COOKIE_NAME, ""), True
        if not token:
            return None

        session = self.auth_session_service.authenticate_access_token(token)
        if via_cookie:
            enforce_csrf(request._request)
        set_current_user(session.user)
        return session.user, session

    def authenticate_header(self, request: Request) -> str:
        """Giá trị WWW-Authenticate (để DRF trả 401 thay vì 403).

        Args:
            request: DRF request.

        Returns:
            Header.
        """
        return 'Bearer realm="api"'
