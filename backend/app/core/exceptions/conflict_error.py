"""Lỗi xung đột dữ liệu (409)."""

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.app_exception import AppException


class ConflictError(AppException):
    """Xung đột dữ liệu/trạng thái, ví dụ trùng khóa duy nhất."""

    status_code = 409
    default_code = ErrorCode.CONFLICT
    default_message = "Dữ liệu bị xung đột."
