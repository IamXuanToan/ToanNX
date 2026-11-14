"""Lỗi vượt giới hạn tần suất (429)."""

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.app_exception import AppException


class RateLimitError(AppException):
    """Vượt giới hạn tần suất; kèm `retry_after` (giây)."""

    status_code = 429
    default_code = ErrorCode.RATE_LIMITED
    default_message = "Bạn thao tác quá nhanh, vui lòng thử lại sau."

    def __init__(self, retry_after: int) -> None:
        """Khởi tạo lỗi rate limit.

        Args:
            retry_after: Số giây client nên chờ trước khi thử lại.
        """
        super().__init__(details={"retry_after": retry_after})
        self.retry_after = retry_after
