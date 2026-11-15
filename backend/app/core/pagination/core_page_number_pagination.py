"""Phân trang chuẩn DRF, trả response theo định dạng chung của hệ thống."""

from typing import Any

from rest_framework.pagination import PageNumberPagination
from rest_framework.request import Request

from app.core.responses.core_pagination_response import CorePaginationResponse
from app.core.schemas.response_envelope import build_success_schema

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


class CorePageNumberPagination(PageNumberPagination):
    """Query `?page=1&page_size=20` (tối đa 100).

    - Chỉ phân trang khi request có `page` hoặc `page_size`; không có thì trả **toàn bộ** danh sách
      (danh mục, ô chọn). Bảng ở FE luôn gửi `page` + `page_size`.
    - Trang vượt quá tổng số trang → 404 `NOT_FOUND` (hành vi chuẩn của DRF).
    """

    page_size = DEFAULT_PAGE_SIZE
    page_size_query_param = "page_size"
    max_page_size = MAX_PAGE_SIZE

    def paginate_queryset(self, queryset: Any, request: Request, view: Any = None) -> list[Any] | None:
        """Phân trang khi có tham số phân trang; ngược lại trả None (view trả hết).

        Args:
            queryset: Queryset đã lọc.
            request: Request.
            view: View.

        Returns:
            Phần tử của trang, hoặc None khi không phân trang.
        """
        params = request.query_params
        if self.page_query_param not in params and self.page_size_query_param not in params:
            return None
        return super().paginate_queryset(queryset, request, view)

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
