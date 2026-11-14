"""API POST /auth/logout."""

from typing import Any

from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.responses.core_response import CoreResponse
from app.core.views.csrf_public_api_view import CsrfPublicApiView
from app.modules.authentication.services.auth_cookie_service import AuthCookieService
from app.modules.authentication.services.auth_session_service import AuthSessionService


class LogoutView(CsrfPublicApiView):
    """Đăng xuất phiên hiện tại (hoạt động cả khi access token đã hết hạn)."""

    def __init__(self, **kwargs: Any) -> None:
        """Khởi tạo service.

        Args:
            **kwargs: Tham số của DRF.
        """
        super().__init__(**kwargs)
        self.auth_session_service = AuthSessionService()

    @extend_schema(request=None, responses={200: None})
    def post(self, request: Request) -> CoreResponse:
        """Thu hồi phiên và xóa cookie.

        Args:
            request: Request.

        Returns:
            Response không có dữ liệu.
        """
        self.auth_session_service.logout(request.COOKIES.get(settings.AUTH_REFRESH_COOKIE_NAME, ""))
        response = CoreResponse()
        AuthCookieService.clear_cookies(response)
        return response
