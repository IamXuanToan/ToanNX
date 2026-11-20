"""Mã lỗi của module Tiện ích. FE dịch theo giá trị; không đổi giá trị đã phát hành."""

from enum import StrEnum


class UtilitiesErrorCode(StrEnum):
    """Mã lỗi nghiệp vụ của module Tiện ích (tiền tố `UTILITIES_`)."""

    SHORT_LINK_EXPIRED = "UTILITIES_SHORT_LINK_EXPIRED"
    # Mã lỗi công khai, không phải mật khẩu.
    SHORT_LINK_INVALID_PASSWORD = "UTILITIES_SHORT_LINK_INVALID_PASSWORD"  # noqa: S105
    PAGE_PATH_IN_USE = "UTILITIES_PAGE_PATH_IN_USE"
    PAGE_PATH_INACTIVE = "UTILITIES_PAGE_PATH_INACTIVE"
    PAGE_VERSION_CONFLICT = "UTILITIES_PAGE_VERSION_CONFLICT"
