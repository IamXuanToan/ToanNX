"""Mã lỗi của module Custom Pages. FE dịch theo giá trị; không đổi giá trị đã phát hành."""

from enum import StrEnum


class CustomPagesErrorCode(StrEnum):
    """Mã lỗi của module Custom Pages."""

    CUSTOM_PAGES_PATH_IN_USE = "CUSTOM_PAGES_PATH_IN_USE"
    CUSTOM_PAGES_PATH_INACTIVE = "CUSTOM_PAGES_PATH_INACTIVE"
    CUSTOM_PAGES_VERSION_CONFLICT = "CUSTOM_PAGES_VERSION_CONFLICT"
