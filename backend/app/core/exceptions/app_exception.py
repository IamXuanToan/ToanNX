"""Ngoại lệ gốc của ứng dụng."""

from typing import Any

from app.core.constants.error_codes import ErrorCode


class AppException(Exception):  # noqa: N818 - tên theo quy chuẩn dự án.
    """Ngoại lệ có mã lỗi ổn định; exception handler chuyển thành response chuẩn.

    Attributes:
        code: Mã lỗi ổn định cho client.
        message: Thông báo mặc định (tiếng Việt).
        status_code: HTTP status.
        details: Thông tin bổ sung an toàn để trả cho client.
    """

    status_code: int = 400
    default_code: str = ErrorCode.BUSINESS_RULE_VIOLATION
    default_message: str = "Yêu cầu không hợp lệ."

    def __init__(
        self,
        message: str | None = None,
        *,
        code: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        """Khởi tạo ngoại lệ.

        Args:
            message: Thông báo cho người dùng; mặc định theo lớp.
            code: Mã lỗi (ErrorCode của core hoặc enum mã lỗi của module); mặc định theo lớp.
            details: Dữ liệu bổ sung (không chứa secrets).
        """
        self.code = code or self.default_code
        self.message = message or self.default_message
        self.details = details or {}
        super().__init__(self.message)
