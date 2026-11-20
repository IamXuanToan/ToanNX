"""Một thay đổi của bản ghi do `JournalTracker` phát ra."""

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class ChangeSet:
    """Sự kiện CRUD của một bản ghi.

    Attributes:
        action: `CREATE`, `UPDATE`, `DELETE` hoặc `EVENT`.
        resource: `<app_label>.<model_name>` (ví dụ `utilities.shortlink`).
        object_id: Khóa chính dạng chuỗi.
        object_label: `str(instance)` lúc ghi.
        changes: `{field: [cũ, mới]}`; field ẩn ghi `["***", "***"]`.
        actor_id: Id người thực hiện (None = hệ thống).
        event: Mã sự kiện khi `action == "EVENT"`.
    """

    action: str
    resource: str
    object_id: str
    object_label: str
    changes: dict[str, list[Any]] = field(default_factory=dict)
    actor_id: Any | None = None
    event: str = ""
