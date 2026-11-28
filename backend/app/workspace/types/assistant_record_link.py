"""Liên kết bản ghi Trợ lý: loại thẻ, nhãn, trang chi tiết Portal và tool sửa tương ứng."""

from typing import NamedTuple


class AssistantRecordLink(NamedTuple):
    """Loại thẻ, nhãn tiếng Việt, đường dẫn chi tiết Portal và tool sửa (+ tên tham số ID) để nhớ bản ghi."""

    card_type: str
    label: str
    path: str
    update_tool: str = ""
    id_arg: str = ""
