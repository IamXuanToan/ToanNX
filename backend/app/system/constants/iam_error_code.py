"""Mã lỗi phần IAM (module System). FE dịch theo giá trị; không đổi giá trị đã phát hành."""

from enum import StrEnum


class IamErrorCode(StrEnum):
    """Mã lỗi phần IAM (module System)."""

    IAM_ROLE_CODE_EXISTS = "IAM_ROLE_CODE_EXISTS"
    IAM_ROLE_INACTIVE = "IAM_ROLE_INACTIVE"
    IAM_SELF_MODIFICATION = "IAM_SELF_MODIFICATION"
    IAM_PRIVILEGE_ESCALATION = "IAM_PRIVILEGE_ESCALATION"
    IAM_SYSTEM_ROLE_PROTECTED = "IAM_SYSTEM_ROLE_PROTECTED"
