"""Lỗi vi phạm quy tắc nghiệp vụ (422)."""

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.app_exception import AppException


class BusinessRuleError(AppException):
    """Thao tác vi phạm quy tắc nghiệp vụ."""

    status_code = 422
    default_code = ErrorCode.BUSINESS_RULE_VIOLATION
    default_message = "Thao tác vi phạm quy tắc nghiệp vụ."
