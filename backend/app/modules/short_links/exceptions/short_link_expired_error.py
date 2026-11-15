"""Lỗi khi liên kết rút gọn đã hết hạn."""

from app.core.exceptions.app_exception import AppException
from app.modules.short_links.constants.short_links_error_code import ShortLinksErrorCode


class ShortLinkExpiredError(AppException):
    """Liên kết đã hết hạn (HTTP 410)."""

    status_code = 410
    default_code = ShortLinksErrorCode.SHORT_LINK_EXPIRED
    default_message = "Liên kết đã hết hạn."
