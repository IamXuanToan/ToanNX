"""Dựng spec "ô cần hỏi" và làm giàu tool schema từ metadata model (verbose_name, help_text, choices).

Mục tiêu: Trợ lý AI tự biết model có gì. Thêm field mới vào model (kèm `choices`/`help_text`) thì AI tự thấy
mô tả, enum, giới hạn; chỉ cần khai tên field trong `ASSISTANT_ASK_FIELDS` nếu muốn bắt người dùng tự quyết.
"""

from __future__ import annotations

import re
from typing import Any

from django.core.exceptions import FieldDoesNotExist
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from app.core.utils.text import to_ascii
from app.workspace.constants.assistant_ask_fields import ASSISTANT_ASK_FIELDS
from app.workspace.constants.assistant_tool_models import ASSISTANT_TOOL_MODELS
from app.workspace.types.assistant_ask_field import AssistantAskField
from app.workspace.types.assistant_ask_slot import AssistantAskSlot
from app.workspace.types.assistant_slot_option import AssistantSlotOption
from app.workspace.types.assistant_tool_spec import AssistantToolSpec

SECRET_MODE_SUFFIX = "__set"  # noqa: S105 - hậu tố tên ô, không phải mật khẩu
_SPEC_CACHE: dict[str, AssistantToolSpec | None] = {}


class AssistantToolSpecBuilder:
    """Sinh `AssistantToolSpec` (có cache theo process) và mô tả field cho schema từ chính model."""

    def spec_for(self, tool: str) -> AssistantToolSpec | None:
        """Spec của tool tạo mới có khai `ASSISTANT_ASK_FIELDS`; `None` nếu tool chạy thẳng."""
        if tool not in _SPEC_CACHE:
            _SPEC_CACHE[tool] = self._build(tool)
        return _SPEC_CACHE[tool]

    def model_field(self, tool: str, name: str) -> models.Field[Any, Any] | None:
        """Field model ứng với tham số `name` của tool (nếu có)."""
        model = ASSISTANT_TOOL_MODELS.get(tool)
        if model is None:
            return None
        try:
            field = model._meta.get_field(name)
        except FieldDoesNotExist:
            return None
        return field if isinstance(field, models.Field) else None

    def describe_args(self, tool: str, args: dict[str, Any]) -> list[dict[str, str]]:
        """Danh sách `{label, value}` tham số đã có (nhãn = `verbose_name`), bỏ ô bí mật và giá trị rỗng."""
        spec = self.spec_for(tool)
        secret_names = {slot.name for slot in spec.ask_slots if slot.secret} if spec else set()
        rows: list[dict[str, str]] = []
        for name, value in args.items():
            if name in secret_names or value in (None, "", [], {}):
                continue
            field = self.model_field(tool, name)
            if field is None:
                continue
            display = str(value)
            if field.choices:
                display = str(dict(field.flatchoices).get(value, value))
            slot = next((item for item in spec.ask_slots if item.name == name), None) if spec else None
            if slot is not None:
                # Giá trị của ô đã chọn hiển thị bằng nhãn lựa chọn ("Chuyển ngay (1 giây)") thay vì số thô.
                display = next((option.label for option in slot.options if option.value == value), display)
            rows.append({"label": str(field.verbose_name), "value": display})
        return rows

    def enrich_schemas(self, schemas: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Bổ sung mô tả/enum/maxLength từ model cho tham số còn thiếu và ghi chú các ô hệ thống sẽ tự hỏi."""
        for schema in schemas:
            function = schema.get("function") or {}
            tool = str(function.get("name") or "")
            if tool not in ASSISTANT_TOOL_MODELS:
                continue
            properties = (function.get("parameters") or {}).get("properties") or {}
            for name, prop in properties.items():
                field = self.model_field(tool, name)
                if field is None or not isinstance(prop, dict):
                    continue
                if not prop.get("description"):
                    prop["description"] = self._field_text(field)
                if field.choices and prop.get("type") == "string" and "enum" not in prop:
                    prop["enum"] = [str(value) for value, _ in field.flatchoices]
                if field.choices and "Giá trị:" not in str(prop.get("description")):
                    labels = ", ".join(f"{value}={label}" for value, label in field.flatchoices)
                    prop["description"] = f"{prop['description']} Giá trị: {labels}."
                max_length = getattr(field, "max_length", None)
                if max_length and prop.get("type") == "string" and "maxLength" not in prop:
                    prop["maxLength"] = int(max_length)
            spec = self.spec_for(tool)
            if spec is not None:
                asked = ", ".join(slot.question.split("?")[0] for slot in spec.ask_slots if not slot.internal)
                note = (
                    f" Chỉ truyền các tùy chọn ({asked}) khi người dùng đã nói rõ; thiếu thì hệ thống tự hỏi "
                    "người dùng bằng nút chọn — không tự điền giá trị mặc định."
                )
                if note not in str(function.get("description")):
                    function["description"] = f"{function.get('description') or ''}{note}"
        return schemas

    def normalize(self, text: str) -> str:
        """Chữ thường không dấu, gộp khoảng trắng (dùng chung cho nhận diện gợi ý)."""
        lowered = to_ascii(text or "").lower()
        cleaned = "".join(char if char.isalnum() else " " for char in lowered)
        return " ".join(cleaned.split())

    # ------------------------------------------------------------------ Nội bộ
    def _build(self, tool: str) -> AssistantToolSpec | None:
        declarations = ASSISTANT_ASK_FIELDS.get(tool)
        model = ASSISTANT_TOOL_MODELS.get(tool)
        if not declarations or model is None:
            return None
        slots: list[AssistantAskSlot] = []
        for decl in declarations:
            slots.extend(self._slots_for(tool, decl))
        return AssistantToolSpec(tool=tool, title=str(model._meta.verbose_name), ask_slots=tuple(slots))

    def _slots_for(self, tool: str, decl: AssistantAskField) -> list[AssistantAskSlot]:
        field = self.model_field(tool, decl.name)
        if decl.secret_toggle is not None:
            mode_name = f"{decl.name}{SECRET_MODE_SUFFIX}"
            off_label, on_label = decl.secret_toggle
            mode_slot = AssistantAskSlot(
                name=mode_name,
                question=decl.question or f"{on_label}?",
                options=(
                    self._option(off_label, False, decl.extra_hints.get(False, ())),
                    self._option(on_label, True, decl.extra_hints.get(True, ())),
                ),
                internal=True,
                only_if=decl.only_if,
            )
            value_slot = AssistantAskSlot(
                name=decl.name,
                question=(decl.secret_prompt or f"Nhập giá trị cho mục {on_label.lower()}")
                + " (tin nhắn này sẽ được che khỏi lịch sử):",
                free_text=True,
                secret=True,
                only_if=(mode_name, True),
            )
            return [mode_slot, value_slot]

        question = decl.question or (self._question(field) if field is not None else decl.name)
        options: list[AssistantSlotOption] = []
        if field is not None and field.choices:
            for value, label in field.flatchoices:
                options.append(self._option(str(label), value, decl.extra_hints.get(value, ())))
        elif isinstance(field, models.BooleanField) and not decl.presets:
            options = [
                self._option("Có", True, decl.extra_hints.get(True, ())),
                self._option("Không", False, decl.extra_hints.get(False, ())),
            ]
        for preset in decl.presets:
            value = list(preset) if isinstance(preset, tuple) else preset
            options.append(
                self._option(self._preset_label(decl, preset), value, decl.extra_hints.get(preset, ()))
            )
        min_value, max_value = self._bounds(field)
        units = tuple(unit for unit in (decl.unit, *decl.alt_units) if unit is not None)
        return [
            AssistantAskSlot(
                name=decl.name,
                question=question,
                options=tuple(options),
                free_text=decl.value_kind == "text",
                value_kind=decl.value_kind,
                generic_values=decl.generic_values,
                placeholder=decl.placeholder,
                only_if=decl.only_if,
                units=units,
                context_words=decl.context_words,
                min_value=min_value,
                max_value=max_value,
                list_value=decl.list_value,
                when_arg_present=decl.when_arg_present,
                when_arg_absent=decl.when_arg_absent,
            )
        ]

    def _option(self, label: str, value: Any, extra: tuple[str, ...]) -> AssistantSlotOption:
        hints = {self.normalize(label), *(self.normalize(item) for item in extra)}
        if isinstance(value, str) and value:
            hints.add(self.normalize(value))
        return AssistantSlotOption(
            label=label, value=value, hints=tuple(sorted(item for item in hints if item))
        )

    def _preset_label(self, decl: AssistantAskField, preset: Any) -> str:
        if preset in decl.preset_labels:
            return decl.preset_labels[preset]
        if isinstance(preset, str):
            return preset
        if preset is None:
            return decl.null_label or "Không đặt"
        if preset in (0, ()):
            return decl.zero_label or "Không"
        number = ", ".join(str(item) for item in preset) if isinstance(preset, tuple) else str(preset)
        return decl.preset_label.format(n=number) if decl.preset_label else number

    def _question(self, field: models.Field[Any, Any]) -> str:
        """Câu hỏi gọn từ `verbose_name`, bỏ chú thích trong ngoặc ("Nhắc trước (phút)" → "Nhắc trước?")."""
        title = re.sub(r"\s*\([^)]*\)", "", str(field.verbose_name)).strip()
        return f"{title[:1].upper()}{title[1:]}?"

    def _field_text(self, field: models.Field[Any, Any]) -> str:
        help_text = str(field.help_text or "").strip()
        return f"{field.verbose_name}" + (f": {help_text}" if help_text else "")

    def _bounds(self, field: models.Field[Any, Any] | None) -> tuple[int | None, int | None]:
        if field is None:
            return None, None
        positive = (
            models.PositiveIntegerField,
            models.PositiveSmallIntegerField,
            models.PositiveBigIntegerField,
        )
        min_value: int | None = 0 if isinstance(field, positive) else None
        max_value: int | None = None
        for validator in field.validators:
            if isinstance(validator, MinValueValidator):
                min_value = int(validator.limit_value)
            elif isinstance(validator, MaxValueValidator):
                max_value = int(validator.limit_value)
        return min_value, max_value
