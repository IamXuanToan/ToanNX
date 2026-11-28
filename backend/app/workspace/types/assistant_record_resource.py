"""Một tài nguyên Client Portal cho tool chung `list_my_records` / `update_my_record` của Trợ lý AI."""

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class AssistantRecordResource:
    """Một dòng registry: model, service (tên thuộc tính trong `AssistantRecordToolsService`), quyền,
    serializer.

    - `owner_field`: field chủ sở hữu để ép lọc "chỉ của tôi"; rỗng = tài nguyên dùng chung chỉ đọc (VD
    đường dẫn giữa).
    - `update_serializer`: serializer validate của chính API (luật y hệt giao diện); `None` = không sửa qua
    chat.
    - `list_fields`: field trả về khi liệt kê; `title_fields`: field làm tên hiển thị; `search_fields`: lọc
    theo từ khóa.
    - `detail_path`: trang chi tiết Portal (`{id}`), dùng dựng link xem lại.
    """

    key: str
    label: str
    model: type[Any]
    service_attr: str
    read_permission: str
    update_permission: str = ""
    update_serializer: type[Any] | None = None
    owner_field: str = "owner"
    title_fields: tuple[str, ...] = ()
    list_fields: tuple[str, ...] = ()
    search_fields: tuple[str, ...] = ()
    ordering: tuple[str, ...] = ("-created_at",)
    detail_path: str = ""
    base_filter: dict[str, Any] = field(default_factory=dict)
    note: str = ""
