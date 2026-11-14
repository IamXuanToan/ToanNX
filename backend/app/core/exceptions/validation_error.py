"""Lỗi dữ liệu không hợp lệ (400)."""

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.app_exception import AppException


class ValidationError(AppException):
    """Dữ liệu hoặc quy tắc hợp lệ bị vi phạm."""

    status_code = 400
    default_code = ErrorCode.VALIDATION_ERROR
    default_message = "Dữ liệu không hợp lệ."
