"""Kiểm tra CSRF cho API dùng cookie.

Dùng cơ chế CSRF của Django (double-submit: cookie `csrftoken` + header
`X-CSRFToken`, kèm kiểm tra Origin/Referer theo CSRF_TRUSTED_ORIGINS).
Request dùng `Authorization: Bearer` không cần CSRF vì trình duyệt không tự gửi header đó.
"""

from django.http import HttpRequest, HttpResponse
from django.middleware.csrf import CsrfViewMiddleware

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.authorization_error import AuthorizationError


class _CsrfCheck(CsrfViewMiddleware):
    """Trả lý do thất bại thay vì render trang lỗi HTML (chỉ dùng nội bộ file này)."""

    def _reject(self, request: HttpRequest, reason: str) -> str:
        return reason


def _empty_response(request: HttpRequest) -> HttpResponse:
    return HttpResponse()


def enforce_csrf(request: HttpRequest) -> None:
    """Kiểm tra CSRF; phương thức an toàn (GET/HEAD/OPTIONS) luôn qua.

    Args:
        request: Django HttpRequest gốc.

    Raises:
        AuthorizationError: AUTH_CSRF_FAILED khi token/Origin không hợp lệ.
    """
    check = _CsrfCheck(_empty_response)
    check.process_request(request)
    reason = check.process_view(request, None, (), {})  # type: ignore[arg-type]  # view không dùng
    if reason:
        raise AuthorizationError(
            "Phiên làm việc không hợp lệ, vui lòng tải lại trang.", code=ErrorCode.AUTH_CSRF_FAILED
        )
