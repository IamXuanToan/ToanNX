"""AutoSchema của dự án: mô tả đúng envelope response chuẩn trong OpenAPI."""

from typing import Any

from drf_spectacular.openapi import AutoSchema
from drf_spectacular.utils import OpenApiResponse

from app.core.schemas.response_envelope import build_success_schema


class CoreAutoSchema(AutoSchema):
    """Bọc mọi response 2xx có body vào `{"success": true, "data": ..., "meta": ...}`.

    - Response danh sách có phân trang đã được bọc bởi
      `CorePageNumberPagination.get_paginated_response_schema` → bỏ qua.
    - 204/không body → giữ nguyên.
    - Request body của `CoreModelViewSet` lấy từ `create_serializer_class`/`update_serializer_class`
      (response vẫn dùng `list_serializer_class`/`detail_serializer_class`).
    - APIView: `@validate_request` tự khai báo request; view chỉ cần `@extend_schema(responses=...)`
      với serializer của phần `data` (không tự viết envelope).
    """

    _REQUEST_SERIALIZER_ATTRS = {
        "create": "create_serializer_class",
        "partial_update": "update_serializer_class",
        "update": "update_serializer_class",
    }

    def get_request_serializer(self) -> Any:
        """Serializer của request body.

        Returns:
            Validate serializer của action (ViewSet) hoặc mặc định của drf-spectacular.
        """
        attr = self._REQUEST_SERIALIZER_ATTRS.get(getattr(self.view, "action", None) or "")
        serializer_class = getattr(self.view, attr, None) if attr else None
        return serializer_class if serializer_class is not None else super().get_request_serializer()

    def _get_response_for_code(
        self,
        serializer: Any,
        status_code: str,
        media_types: Any = None,
        direction: Any = "response",
    ) -> dict[str, Any]:
        """Dựng response OpenAPI rồi bọc envelope chuẩn.

        Args:
            serializer: Serializer/kiểu của response.
            status_code: HTTP status dạng chuỗi.
            media_types: Media type ghi đè.
            direction: "request" hoặc "response".

        Returns:
            Response object của OpenAPI.
        """
        response: dict[str, Any] = super()._get_response_for_code(
            serializer, status_code, media_types, direction
        )
        if not ("200" <= status_code < "300") or "content" not in response:
            return response
        if self._is_paginated(serializer):
            return response
        for media in response["content"].values():
            media["schema"] = build_success_schema(media["schema"])
        return response

    def _is_paginated(self, serializer: Any) -> bool:
        """Response có đi qua pagination của view hay không.

        Args:
            serializer: Serializer của response.

        Returns:
            True nếu là danh sách được phân trang.
        """
        inner = serializer.response if isinstance(serializer, OpenApiResponse) else serializer
        if isinstance(inner, dict):
            return False
        return bool(self._get_paginator()) and bool(self._is_list_view(inner))
