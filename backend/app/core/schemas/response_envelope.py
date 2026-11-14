"""Schema OpenAPI của body response chuẩn (dùng chung cho AutoSchema và pagination)."""

from typing import Any

PAGINATION_SCHEMA: dict[str, Any] = {
    "type": "object",
    "description": "Thông tin phân trang.",
    "properties": {
        "page": {"type": "integer", "description": "Trang hiện tại (bắt đầu từ 1)."},
        "page_size": {"type": "integer", "description": "Số phần tử mỗi trang."},
        "total": {"type": "integer", "description": "Tổng số phần tử."},
        "total_pages": {"type": "integer", "description": "Tổng số trang."},
    },
    "required": ["page", "page_size", "total", "total_pages"],
}


def build_meta_schema(*, paginated: bool = False) -> dict[str, Any]:
    """Schema khối `meta`.

    Args:
        paginated: Có kèm `pagination` hay không.

    Returns:
        Schema OpenAPI.
    """
    properties: dict[str, Any] = {
        "request_id": {"type": "string", "description": "Id request (khớp header X-Request-ID)."},
        "timestamp": {"type": "string", "format": "date-time", "description": "Thời điểm phản hồi."},
    }
    if paginated:
        properties["pagination"] = PAGINATION_SCHEMA
    return {"type": "object", "properties": properties, "required": list(properties)}


def build_success_schema(data_schema: dict[str, Any], *, paginated: bool = False) -> dict[str, Any]:
    """Bọc schema dữ liệu vào envelope `{"success", "data", "meta"}`.

    Args:
        data_schema: Schema của `data`.
        paginated: Response danh sách có phân trang.

    Returns:
        Schema OpenAPI.
    """
    return {
        "type": "object",
        "properties": {
            "success": {"type": "boolean", "description": "Luôn true với response thành công."},
            "data": data_schema,
            "meta": build_meta_schema(paginated=paginated),
        },
        "required": ["success", "data", "meta"],
    }
