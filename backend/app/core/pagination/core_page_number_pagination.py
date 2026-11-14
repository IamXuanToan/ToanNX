"""Phân trang chuẩn DRF, trả response theo định dạng chung của hệ thống."""

from typing import Any

from rest_framework.pagination import PageNumberPagination

from app.core.responses.core_pagination_response import CorePaginationResponse
from app.core.schemas.response_envelope import build_success_schema

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


class CorePageNumberPagination(PageNumberPagination):
    """Query `?page=1&page_size=20` (tối đa 100).

    Trang vượt quá tổng số trang → 404 `NOT_FOUND` (hành vi chuẩn của DRF).
    """

    page_size = DEFAULT_PAGE_SIZE
    page_size_query_param = "page_size"
    max_page_size = MAX_PAGE_SIZE

    def get_paginated_response(self, data: Any) -> CorePaginationResponse:
        """Bọc dữ liệu trang vào response chuẩn.

        Args:
            data: Danh sách phần tử đã serialize.

        Returns:
            Response có `meta.pagination`.
        """
        assert self.page is not None  # noqa: S101 - DRF chỉ gọi sau paginate_queryset thành công.
        return CorePaginationResponse(
            data,
            {
                "page": self.page.number,
                "page_size": self.page.paginator.per_page,
                "total": self.page.paginator.count,
                "total_pages": self.page.paginator.num_pages,
            },
        )

    def get_paginated_response_schema(self, schema: dict[str, Any]) -> dict[str, Any]:
        """Schema OpenAPI cho response phân trang (drf-spectacular).

        Args:
            schema: Schema mảng phần tử.

        Returns:
            Schema envelope có `meta.pagination`.
        """
        return build_success_schema(schema, paginated=True)
