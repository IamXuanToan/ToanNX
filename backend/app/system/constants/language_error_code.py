"""Mã lỗi nghiệp vụ cho tài nguyên Ngôn ngữ (`Language`)."""

from enum import StrEnum


class LanguageErrorCode(StrEnum):
    """Mã lỗi chuẩn trả về ở `error.code` cho Language API."""

    CODE_CONFLICT = "SYSTEM_LANGUAGE_CODE_CONFLICT"
    DEFAULT_PROTECTED = "SYSTEM_LANGUAGE_DEFAULT_PROTECTED"
    IN_USE = "SYSTEM_LANGUAGE_IN_USE"
