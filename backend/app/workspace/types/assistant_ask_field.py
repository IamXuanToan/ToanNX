"""Khai báo field cần hỏi người dùng của một tool tạo mới; nhãn/câu hỏi/enum tự lấy từ metadata model."""

from dataclasses import dataclass, field
from typing import Any

from app.workspace.types.assistant_number_unit import AssistantNumberUnit


@dataclass(frozen=True)
class AssistantAskField:
    """Chỉ khai phần model không tự nói được: mốc gợi ý cho field số, nhãn cho null/0, từ đồng nghĩa.

    - `name`: tên tham số tool (thường trùng tên field model).
    - `presets`: giá trị gợi ý thành nút (số hoặc tuple cho field danh sách); field có `choices` để trống.
    - `alt_units`: đơn vị phụ có `factor` (VD "1 tiếng" = 60 phút).
    - `unit` + `preset_label` (VD "Trước {n} phút"): nhận diện số người dùng tự gõ và dựng nhãn nút.
    - `zero_label` / `null_label`: nhãn cho giá trị 0 / null (VD "Không nhắc trước", "Chờ bấm nút").
    - `secret_toggle`: (nhãn không đặt, nhãn có đặt) cho giá trị bí mật gõ tự do (VD mật khẩu);
      `secret_prompt` là câu mời gõ giá trị đó.
    - `when_arg_present` / `when_arg_absent`: chỉ hỏi khi tham số khác có/không (VD hỏi phút khi có giờ).
    - `only_if`: chỉ hỏi khi ô khác đã chọn đúng giá trị (VD số ngày tùy chỉnh khi chu kỳ là CUSTOM_DAYS).
    - `value_kind`: `text` (gõ tự do, VD tiêu đề), `time` (giờ HH:MM), `date` (ngày) — đọc bằng
      `AssistantDateTimeParser`; `generic_values` là từ chung chung không coi là người dùng đã nêu
      (VD tiêu đề "nhắc lịch"); `placeholder` là gợi ý ô nhập nhanh.
    """

    name: str
    presets: tuple[Any, ...] = ()
    unit: AssistantNumberUnit | None = None
    alt_units: tuple[AssistantNumberUnit, ...] = ()
    preset_label: str = ""
    preset_labels: dict[Any, str] = field(default_factory=dict)
    zero_label: str = ""
    null_label: str = ""
    extra_hints: dict[Any, tuple[str, ...]] = field(default_factory=dict)
    context_words: tuple[str, ...] = ()
    secret_toggle: tuple[str, str] | None = None
    secret_prompt: str = ""
    question: str = ""
    when_arg_present: str = ""
    when_arg_absent: str = ""
    only_if: tuple[str, Any] | None = None
    list_value: bool = False
    value_kind: str = ""
    generic_values: tuple[str, ...] = ()
    placeholder: str = ""
