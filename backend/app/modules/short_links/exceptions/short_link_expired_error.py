"""Lỗi khi liên kết rút gọn đã hết hạn."""

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.app_exception import AppException


class ShortLinkExpiredError(AppException):
    """Liên kết đã hết hạn (HTTP 410)."""

    status_code = 410
    default_code = ErrorCode.SHORT_LINK_EXPIRED
    default_message = "Liên kết đã hết hạn."
