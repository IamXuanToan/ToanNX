"""Mã lỗi tiền tệ, tỷ giá (module System). FE dịch theo giá trị."""

from enum import StrEnum


class CurrencyErrorCode(StrEnum):
    """Mã lỗi tiền tệ và tỷ giá."""

    BASE_LOCKED = "SYSTEM_CURRENCY_BASE_LOCKED"
    IN_USE = "SYSTEM_CURRENCY_IN_USE"
    INACTIVE = "SYSTEM_CURRENCY_INACTIVE"
    RATE_UNAVAILABLE = "SYSTEM_EXCHANGE_RATE_UNAVAILABLE"
    RATE_READ_ONLY = "SYSTEM_EXCHANGE_RATE_READ_ONLY"
