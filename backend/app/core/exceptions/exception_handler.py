"""Exception handler tập trung cho DRF và handler 404/500 cho Django."""

import logging
import math
from typing import Any

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404, HttpRequest, JsonResponse
from rest_framework import exceptions as drf
from rest_framework.response import Response
from rest_framework.views import set_rollback

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.app_exception import AppException
from app.core.exceptions.rate_limit_error import RateLimitError
from app.core.responses.core_error_response import CoreErrorResponse
from app.core.responses.response_body import build_error_body

logger = logging.getLogger("app.errors")

_DRF_ERRORS: dict[type[drf.APIException], tuple[ErrorCode, str]] = {
    drf.NotAuthenticated: (ErrorCode.AUTH_NOT_AUTHENTICATED, "Bạn cần đăng nhập để tiếp tục."),
    drf.AuthenticationFailed: (ErrorCode.AUTH_TOKEN_INVALID, "Thông tin xác thực không hợp lệ."),
    drf.PermissionDenied: (ErrorCode.PERMISSION_DENIED, "Bạn không có quyền thực hiện thao tác này."),
    drf.NotFound: (ErrorCode.NOT_FOUND, "Không tìm thấy dữ liệu."),
    drf.MethodNotAllowed: (ErrorCode.METHOD_NOT_ALLOWED, "Phương thức không được hỗ trợ."),
    drf.UnsupportedMediaType: (ErrorCode.UNSUPPORTED_MEDIA_TYPE, "Kiểu nội dung không được hỗ trợ."),
    drf.ParseError: (ErrorCode.PARSE_ERROR, "Dữ liệu gửi lên không đọc được."),
    drf.Throttled: (ErrorCode.RATE_LIMITED, "Bạn thao tác quá nhanh, vui lòng thử lại sau."),
}


def _field_errors(detail: Any) -> dict[str, Any]:
    """Chuẩn hóa lỗi validation của DRF thành {field: [messages]}."""
    if isinstance(detail, dict):
        return {
            str(key): _field_errors(value)
            if isinstance(value, dict)
            else [str(item) for item in (value if isinstance(value, list) else [value])]
            for key, value in detail.items()
        }
    items = detail if isinstance(detail, list) else [detail]
    return {"non_field_errors": [str(item) for item in items]}


def app_exception_handler(exc: Exception, context: dict[str, Any]) -> Response:
    """Chuyển mọi ngoại lệ trong view DRF thành response lỗi chuẩn.

    Lỗi không lường trước được log đầy đủ (kèm request_id), client chỉ nhận
    INTERNAL_ERROR, không có stack trace.

    Args:
        exc: Ngoại lệ.
        context: Ngữ cảnh DRF.

    Returns:
        Response lỗi chuẩn.
    """
    set_rollback()

    if isinstance(exc, AppException):
        headers = {"Retry-After": str(exc.retry_after)} if isinstance(exc, RateLimitError) else None
        return CoreErrorResponse(exc.code, exc.message, exc.status_code, exc.details, headers)

    if isinstance(exc, drf.ValidationError):
        return CoreErrorResponse(
            ErrorCode.VALIDATION_ERROR, "Dữ liệu không hợp lệ.", 400, _field_errors(exc.detail)
        )

    if isinstance(exc, Http404):
        exc = drf.NotFound()
    elif isinstance(exc, DjangoPermissionDenied):
        exc = drf.PermissionDenied()

    if isinstance(exc, drf.APIException):
        code, message = _DRF_ERRORS.get(type(exc), (ErrorCode.VALIDATION_ERROR, "Yêu cầu không hợp lệ."))
        wait = getattr(exc, "wait", None)
        headers = {"Retry-After": str(math.ceil(wait))} if wait else None
        return CoreErrorResponse(code, message, exc.status_code, headers=headers)

    logger.exception("Lỗi không xử lý trong %s", type(context.get("view")).__name__, exc_info=exc)
    return CoreErrorResponse(ErrorCode.INTERNAL_ERROR, "Đã xảy ra lỗi hệ thống.", 500)


def handler404(request: HttpRequest, exception: Exception) -> JsonResponse:
    """Trả JSON 404 cho URL không tồn tại.

    Args:
        request: HTTP request.
        exception: Http404.

    Returns:
        JsonResponse 404.
    """
    return JsonResponse(build_error_body(ErrorCode.NOT_FOUND, "Không tìm thấy đường dẫn."), status=404)


def handler500(request: HttpRequest) -> JsonResponse:
    """Trả JSON 500 cho lỗi ngoài DRF (Django đã log qua logger django.request).

    Args:
        request: HTTP request.

    Returns:
        JsonResponse 500.
    """
    return JsonResponse(build_error_body(ErrorCode.INTERNAL_ERROR, "Đã xảy ra lỗi hệ thống."), status=500)
