"""Response thành công chuẩn."""

from typing import Any

from rest_framework.response import Response

from app.core.responses.response_body import build_meta


class CoreResponse(Response):
    """`{"success": true, "data": ..., "meta": {"request_id", "timestamp"}}`."""

    def __init__(self, data: Any = None, status: int = 200) -> None:
        """Khởi tạo response thành công.

        Args:
            data: Dữ liệu.
            status: HTTP status 2xx.
        """
        super().__init__({"success": True, "data": data, "meta": build_meta()}, status=status)
