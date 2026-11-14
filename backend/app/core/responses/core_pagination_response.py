"""Response danh sách có phân trang."""

from typing import Any

from rest_framework.response import Response

from app.core.responses.response_body import build_meta


class CorePaginationResponse(Response):
    """`{"success": true, "data": [...], "meta": {..., "pagination": {...}}}`."""

    def __init__(self, items: Any, pagination: dict[str, int]) -> None:
        """Khởi tạo response phân trang.

        Args:
            items: Phần tử đã serialize.
            pagination: Thông tin phân trang (page, page_size, total, total_pages).
        """
        super().__init__(
            {"success": True, "data": items, "meta": build_meta(pagination=pagination)},
            status=200,
        )
