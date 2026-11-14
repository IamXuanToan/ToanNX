"""Lỗi không tìm thấy (404)."""

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.app_exception import AppException


class NotFoundError(AppException):
    """Không tìm thấy tài nguyên."""

    status_code = 404
    default_code = ErrorCode.NOT_FOUND
    default_message = "Không tìm thấy dữ liệu."
