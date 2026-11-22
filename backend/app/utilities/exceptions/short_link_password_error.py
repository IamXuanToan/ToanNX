"""Lỗi mật khẩu của liên kết rút gọn."""

from app.core.exceptions.app_exception import AppException
from app.utilities.constants.utilities_error_code import UtilitiesErrorCode


class ShortLinkPasswordError(AppException):
    """Mật khẩu không đúng (HTTP 403)."""

    status_code = 403
    default_code = UtilitiesErrorCode.SHORT_LINK_INVALID_PASSWORD
    default_message = "Mật khẩu liên kết không đúng."
