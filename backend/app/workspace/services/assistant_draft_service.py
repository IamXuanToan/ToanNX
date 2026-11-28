"""Nháp → chọn → tạo: ép hỏi đủ ô người dùng tự quyết bằng code, không tin model tự điền mặc định.

Spec ô cần hỏi dựng từ metadata model (`AssistantToolSpecBuilder`), nên engine này dùng chung cho mọi tool
tạo mới: nhắc việc (nhắc trước bao lâu, lặp lại), link rút gọn (kiểu mở, mật khẩu), dịch vụ, thiết bị...
"""

import re
from typing import Any

from app.workspace.services.assistant_confirmation_service import (
    PENDING_KIND_DRAFT,
    AssistantConfirmationService,
)
from app.workspace.services.assistant_datetime_parser import AssistantDateTimeParser
from app.workspace.services.assistant_tool_spec_builder import SECRET_MODE_SUFFIX, AssistantToolSpecBuilder
from app.workspace.types.assistant_ask_slot import AssistantAskSlot
from app.workspace.types.assistant_tool_spec import AssistantToolSpec

_NUMBER_WITH_UNIT = re.compile(r"^(\d+)([a-z]*)$")
# Số token quanh con số để tìm từ ngữ cảnh ("nhắc **trước** 10 phút", "10 phút **trước**").
_CONTEXT_WINDOW = 3


class AssistantDraftService:
    """Phát hiện ô còn thiếu, lưu nháp, nhận câu trả lời theo số thứ tự / nhãn / "N đơn vị" (0 token)."""

    def __init__(
        self,
        confirmation_service: AssistantConfirmationService | None = None,
        spec_builder: AssistantToolSpecBuilder | None = None,
        datetime_parser: AssistantDateTimeParser | None = None,
    ) -> None:
        """Khởi tạo nơi lưu hành động chờ, bộ dựng spec từ model và bộ đọc ngày/giờ tiếng Việt."""
        self.confirmation_service = confirmation_service or AssistantConfirmationService()
        self.spec_builder = spec_builder or AssistantToolSpecBuilder()
        self.datetime_parser = datetime_parser or AssistantDateTimeParser()

    def spec_for(self, tool: str) -> AssistantToolSpec | None:
        """Spec ô cần hỏi của tool, `None` nếu tool chạy thẳng như cũ."""
        return self.spec_builder.spec_for(tool)

    def active_slots(
        self, spec: AssistantToolSpec, chosen: dict[str, Any], args: dict[str, Any]
    ) -> list[AssistantAskSlot]:
        """Các ô còn hiệu lực theo `only_if`, `when_arg_present/absent` và lựa chọn hiện có."""
        result: list[AssistantAskSlot] = []
        current = {**args, **chosen}
        for slot in spec.ask_slots:
            if slot.only_if is not None and chosen.get(slot.only_if[0], object()) != slot.only_if[1]:
                continue
            if slot.when_arg_present and not current.get(slot.when_arg_present):
                continue
            if slot.when_arg_absent and current.get(slot.when_arg_absent):
                continue
            result.append(slot)
        return result

    def detect_from_text(
        self, spec: AssistantToolSpec, user_text: str, args: dict[str, Any]
    ) -> dict[str, Any]:
        """Lựa chọn người dùng đã tự nêu trong câu; giá trị bí mật phải xuất hiện nguyên văn trong câu."""
        normalized = self.spec_builder.normalize(user_text)
        padded = f" {normalized} "
        tokens = normalized.split()
        chosen: dict[str, Any] = {}
        for slot in spec.ask_slots:
            if slot.value_kind == "time":
                found_time = self.datetime_parser.find_time(user_text)
                if found_time is not None:
                    chosen[slot.name] = found_time
                continue
            if slot.value_kind == "date":
                found_date = self.datetime_parser.find_date(user_text)
                if found_date is not None:
                    chosen[slot.name] = found_date
                continue
            if slot.value_kind == "text":
                suggested = str(args.get(slot.name) or "").strip()
                if suggested and self._is_stated(suggested, slot, tokens):
                    chosen[slot.name] = suggested
                continue
            if slot.free_text:
                raw_value = str(args.get(slot.name) or "")
                if raw_value and raw_value in (user_text or ""):
                    chosen[slot.name] = raw_value
                    if slot.only_if is not None:
                        chosen.setdefault(slot.only_if[0], slot.only_if[1])
                continue
            number = self._number_from_tokens(slot, tokens)
            if number is not None:
                chosen[slot.name] = [number] if slot.list_value else number
                continue
            for option in slot.options:
                if any(f" {hint} " in padded for hint in option.hints):
                    chosen.setdefault(slot.name, option.value)
                    break
        self._infer_date_from_time(spec, chosen, args)
        return chosen

    def _infer_date_from_time(
        self, spec: AssistantToolSpec, chosen: dict[str, Any], args: dict[str, Any]
    ) -> None:
        """Nói giờ mà không nói ngày ("nhắc lúc 11h") → ngày model hiểu từ ngữ cảnh, không có thì hôm nay."""
        has_time = any(slot.value_kind == "time" and slot.name in chosen for slot in spec.ask_slots)
        if not has_time:
            return
        for slot in spec.ask_slots:
            if slot.value_kind == "date" and slot.name not in chosen:
                chosen[slot.name] = str(args.get(slot.name) or "") or "@today"

    def _is_stated(self, value: str, slot: AssistantAskSlot, user_tokens: list[str]) -> bool:
        """Giá trị chữ (VD tiêu đề) coi là người dùng đã nêu khi mọi từ có nghĩa của nó đều nằm trong câu."""
        generic = set(slot.generic_values)
        meaningful = [
            token
            for token in self.spec_builder.normalize(value).split()
            if token not in generic and not any(char.isdigit() for char in token)
        ]
        if not meaningful:
            return False
        available = set(user_tokens)
        return all(token in available for token in meaningful)

    def missing_slots(
        self, spec: AssistantToolSpec, chosen: dict[str, Any], args: dict[str, Any]
    ) -> list[str]:
        """Tên các ô còn thiếu theo đúng thứ tự khai."""
        return [slot.name for slot in self.active_slots(spec, chosen, args) if slot.name not in chosen]

    def merge_into_args(
        self, spec: AssistantToolSpec, args: dict[str, Any], chosen: dict[str, Any]
    ) -> dict[str, Any]:
        """Ghi lựa chọn vào tham số tool; ô bật/tắt bí mật = tắt thì giá trị bí mật là chuỗi rỗng."""
        merged = dict(args)
        for slot in spec.ask_slots:
            if slot.internal:
                if slot.name in chosen and chosen[slot.name] is False:
                    merged[slot.name.removesuffix(SECRET_MODE_SUFFIX)] = ""
                continue
            if slot.name in chosen:
                value = chosen[slot.name]
                if slot.value_kind == "date" and isinstance(value, str):
                    value = self.datetime_parser.resolve_date(value)
                merged[slot.name] = value
        return merged

    def start(
        self,
        *,
        spec: AssistantToolSpec,
        conversation_id: str,
        owner_id: Any,
        args: dict[str, Any],
        chosen: dict[str, Any],
        turn_id: str,
    ) -> dict[str, Any] | None:
        """Lưu nháp và trả câu hỏi cho ô thiếu đầu tiên; `None` nếu không lưu được (thiếu hội thoại)."""
        secret = {slot.name for slot in spec.ask_slots if slot.secret}
        missing = self.missing_slots(spec, chosen, args)
        token = self.confirmation_service.stage_draft(
            conversation_id=conversation_id,
            owner_id=owner_id,
            tool=spec.tool,
            args={key: value for key, value in args.items() if key not in secret},
            pending_slots=missing,
            chosen={key: value for key, value in chosen.items() if key not in secret},
            turn_id=turn_id,
        )
        if not token:
            return None
        return self.question_payload(spec, missing[0], token)

    def question_payload(self, spec: AssistantToolSpec, slot_name: str, token: str) -> dict[str, Any]:
        """Payload `needs_choice` chuẩn cho ô `slot_name`."""
        slot = self._slot(spec, slot_name)
        return {
            "slot": slot.name,
            "question": slot.question,
            "free_text": slot.free_text,
            "secret": slot.secret,
            "accepts_number": bool(slot.units),
            "unit": slot.units[0].label if slot.units else "",
            "input_kind": slot.value_kind
            or ("secret" if slot.secret else ("text" if slot.free_text else "")),
            "placeholder": slot.placeholder,
            "options": [{"label": option.label, "value": option.value} for option in slot.options],
            "draft_token": token,
        }

    def answer(self, conversation: Any, text: str) -> dict[str, Any] | None:
        """Ghép câu trả lời vào nháp đang chờ.

        Trả `None` nếu không có nháp hoặc câu không khớp lựa chọn (nháp bị bỏ để chat bình thường); trả
        `{"done": False, "question": ...}` khi còn ô thiếu; `{"done": True, "tool", "args", "chosen"}` khi đủ.
        Khóa `secret` cho biết tin vừa gửi phải được che.
        """
        draft = self.confirmation_service.read_from(conversation)
        if draft is None or draft.get("kind") != PENDING_KIND_DRAFT:
            return None
        if str(draft.get("owner_id")) != str(conversation.owner_id):
            return None
        spec = self.spec_for(str(draft.get("tool") or ""))
        pending = list(draft.get("pending_slots") or [])
        if spec is None or not pending:
            self.confirmation_service.clear(str(conversation.pk))
            return None
        slot = self._slot(spec, pending[0])
        matched, value = self._match(slot, text)
        if not matched:
            self.confirmation_service.clear(str(conversation.pk))
            return None
        args = dict(draft.get("args") or {})
        chosen = dict(draft.get("chosen") or {})
        chosen[slot.name] = value
        missing = self.missing_slots(spec, chosen, args)
        if missing:
            secret = {item.name for item in spec.ask_slots if item.secret}
            draft["chosen"] = {key: val for key, val in chosen.items() if key not in secret}
            draft["pending_slots"] = missing
            self.confirmation_service.update_draft(str(conversation.pk), draft)
            return {
                "done": False,
                "secret": slot.secret,
                "question": self.question_payload(spec, missing[0], str(draft.get("token") or "")),
            }
        self.confirmation_service.clear(str(conversation.pk))
        return {"done": True, "secret": slot.secret, "tool": spec.tool, "args": args, "chosen": chosen}

    # ------------------------------------------------------------------ Nội bộ
    def _match(self, slot: AssistantAskSlot, text: str) -> tuple[bool, Any]:
        cleaned = (text or "").strip()
        if not cleaned:
            return False, None
        if slot.value_kind in ("time", "date"):
            return self._match_datetime(slot, cleaned)
        if slot.free_text:
            return True, cleaned
        if cleaned.isdigit():
            index = int(cleaned) - 1
            if 0 <= index < len(slot.options):
                return True, slot.options[index].value
            return False, None
        normalized = self.spec_builder.normalize(cleaned)
        for option in slot.options:
            if normalized == self.spec_builder.normalize(option.label):
                return True, option.value
        # Trả lời "10 phút" / "2 tiếng" khi đang hỏi ô số (đang trả lời đúng câu hỏi nên không cần ngữ cảnh).
        number = self._number_from_tokens(slot, normalized.split(), require_context=False)
        if number is not None:
            return True, [number] if slot.list_value else number
        padded = f" {normalized} "
        for option in slot.options:
            if any(f" {hint} " in padded for hint in option.hints):
                return True, option.value
        return False, None

    def _match_datetime(self, slot: AssistantAskSlot, cleaned: str) -> tuple[bool, Any]:
        """Trả lời ô ngày/giờ: nhãn nút, số thứ tự nhỏ hoặc gõ tự do ("14:30", "2h chiều", "05/12")."""
        normalized = self.spec_builder.normalize(cleaned)
        for option in slot.options:
            if normalized == self.spec_builder.normalize(option.label):
                return True, option.value
        if cleaned.isdigit() and 1 <= int(cleaned) <= len(slot.options) and slot.value_kind == "date":
            return True, slot.options[int(cleaned) - 1].value
        if slot.value_kind == "time":
            if cleaned.isdigit() and int(cleaned) <= len(slot.options) and int(cleaned) < 7:
                return True, slot.options[int(cleaned) - 1].value
            parsed = self.datetime_parser.parse_time_answer(cleaned)
        else:
            parsed = self.datetime_parser.find_date(cleaned)
        return (True, parsed) if parsed is not None else (False, None)

    def _number_from_tokens(
        self, slot: AssistantAskSlot, tokens: list[str], *, require_context: bool = True
    ) -> int | None:
        """Tìm "N <đơn vị>" (VD `10 phut`, `10p`, `1 tieng`) gần từ ngữ cảnh của ô; quy về đơn vị gốc."""
        if not slot.units:
            return None
        # (vị trí, giá trị, có từ ngữ cảnh đứng trước, có từ ngữ cảnh đứng sau)
        candidates: list[tuple[int, int, bool, bool]] = []
        for idx, token in enumerate(tokens):
            match = _NUMBER_WITH_UNIT.match(token)
            if match is None:
                continue
            separate_unit = not match.group(2)
            unit_token = match.group(2) or (tokens[idx + 1] if idx + 1 < len(tokens) else "")
            unit = next((item for item in slot.units if unit_token in item.tokens), None)
            if unit is None:
                continue
            after_start = idx + (2 if separate_unit else 1)
            before = f" {' '.join(tokens[max(0, idx - _CONTEXT_WINDOW) : idx])} "
            after = f" {' '.join(tokens[after_start : after_start + 1])} "
            candidates.append(
                (
                    idx,
                    int(match.group(1)) * unit.factor,
                    any(f" {word} " in before for word in slot.context_words),
                    any(f" {word} " in after for word in slot.context_words),
                )
            )
        if not candidates:
            return None
        if require_context and slot.context_words:
            # Ưu tiên "trước 10 phút" hơn "11h ... trước" để không nhầm giờ hẹn thành thời gian nhắc trước.
            picked = next((item for item in candidates if item[2]), None) or next(
                (item for item in candidates if item[3]), None
            )
        else:
            picked = candidates[0]
        if picked is None:
            return None
        value = picked[1]
        if slot.min_value is not None:
            value = max(slot.min_value, value)
        if slot.max_value is not None:
            value = min(slot.max_value, value)
        return value

    def _slot(self, spec: AssistantToolSpec, name: str) -> AssistantAskSlot:
        for slot in spec.ask_slots:
            if slot.name == name:
                return slot
        raise KeyError(name)
