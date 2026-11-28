"""Đơn vị số để nhận diện câu kiểu "trước 10 phút", "đếm ngược 5s", "bảo hành 12 tháng"."""

from dataclasses import dataclass


@dataclass(frozen=True)
class AssistantNumberUnit:
    """`label` hiển thị; `tokens` là cách viết không dấu sau con số; `factor` quy về đơn vị gốc (giờ = 60)."""

    label: str
    tokens: tuple[str, ...]
    factor: int = 1
