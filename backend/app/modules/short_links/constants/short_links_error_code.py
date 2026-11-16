"""Mã lỗi của module Short Links. FE dịch theo giá trị; không đổi giá trị đã phát hành."""

from enum import StrEnum


class ShortLinksErrorCode(StrEnum):
    """Mã lỗi của module Short Links."""

    SHORT_LINK_EXPIRED = "SHORT_LINK_EXPIRED"
    SHORT_LINK_INVALID_PASSWORD = "SHORT_LINK_INVALID_PASSWORD"  # noqa: S105  # Mã lỗi công khai, không phải mật khẩu.
