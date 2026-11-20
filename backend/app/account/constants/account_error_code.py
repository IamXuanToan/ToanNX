"""Mã lỗi của module Account. FE dịch theo giá trị; không đổi giá trị đã phát hành."""

from enum import StrEnum


class AccountErrorCode(StrEnum):
    """Mã lỗi của module Account."""

    ACCOUNT_EMAIL_EXISTS = "ACCOUNT_EMAIL_EXISTS"
    ACCOUNT_PASSWORD_WEAK = "ACCOUNT_PASSWORD_WEAK"  # noqa: S105 - mã lỗi, không phải mật khẩu
    ACCOUNT_LAST_SUPERUSER = "ACCOUNT_LAST_SUPERUSER"
    ACCOUNT_SELF_MODIFICATION = "ACCOUNT_SELF_MODIFICATION"
    ACCOUNT_PRIVILEGE_ESCALATION = "ACCOUNT_PRIVILEGE_ESCALATION"
    ACCOUNT_SUPERUSER_PROTECTED = "ACCOUNT_SUPERUSER_PROTECTED"
