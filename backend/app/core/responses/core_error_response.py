"""Response lỗi chuẩn."""

from typing import Any

from rest_framework.response import Response

from app.core.responses.response_body import build_error_body


class CoreErrorResponse(Response):
    """`{"success": false, "error": {...}}`. Không bao giờ chứa stack trace hay secrets."""

    def __init__(
        self,
        code: str,
        message: str,
        status: int,
        details: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        """Khởi tạo response lỗi.

        Args:
            code: Mã lỗi.
            message: Thông báo.
            status: HTTP status 4xx/5xx.
            details: Chi tiết an toàn.
            headers: Header bổ sung.
        """
        super().__init__(build_error_body(code, message, details), status=status, headers=headers)
