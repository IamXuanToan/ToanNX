"""Mã lỗi của tính năng Mẫu Email (module System)."""

from enum import StrEnum


class EmailTemplateErrorCode(StrEnum):
    """Mã lỗi nghiệp vụ cho EmailTemplate."""

    CODE_CONFLICT = "SYSTEM_EMAIL_TEMPLATE_CODE_CONFLICT"
    SYSTEM_DEFAULT_PROTECTED = "SYSTEM_EMAIL_TEMPLATE_DEFAULT_PROTECTED"
