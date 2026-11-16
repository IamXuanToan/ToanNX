"""Lỗi mật khẩu của liên kết rút gọn."""

from app.core.exceptions.app_exception import AppException
from app.modules.short_links.constants.short_links_error_code import ShortLinksErrorCode


class ShortLinkPasswordError(AppException):
    """Mật khẩu không đúng (HTTP 403)."""

    status_code = 403
    default_code = ShortLinksErrorCode.SHORT_LINK_INVALID_PASSWORD
    default_message = "Mật khẩu liên kết không đúng."
