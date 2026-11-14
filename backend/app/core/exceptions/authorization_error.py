"""Lỗi không đủ quyền (403)."""

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.app_exception import AppException


class AuthorizationError(AppException):
    """Đã xác thực nhưng không đủ quyền."""

    status_code = 403
    default_code = ErrorCode.PERMISSION_DENIED
    default_message = "Bạn không có quyền thực hiện thao tác này."
