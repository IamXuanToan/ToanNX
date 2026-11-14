"""Lỗi xác thực (401)."""

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.app_exception import AppException


class AuthenticationError(AppException):
    """Chưa xác thực hoặc thông tin xác thực sai."""

    status_code = 401
    default_code = ErrorCode.AUTH_NOT_AUTHENTICATED
    default_message = "Bạn cần đăng nhập để tiếp tục."
