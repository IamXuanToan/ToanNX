"""Chặn lệch giữa tool schema Trợ lý AI và model thật (VD từng khai `DISABLED`, model là `INACTIVE`)."""

from collections.abc import Iterator
from typing import Any

from django.apps import apps
from django.db import models

from app.workspace.constants.assistant_ask_fields import ASSISTANT_ASK_FIELDS, ASSISTANT_NO_ASK_TOOLS
from app.workspace.constants.assistant_record_resources import ASSISTANT_RECORD_RESOURCES
from app.workspace.constants.assistant_tool_models import ASSISTANT_TOOL_MODELS
from app.workspace.constants.assistant_tool_permissions import DELETE_RESOURCE_PERMISSION_MAP
from app.workspace.constants.assistant_tool_schemas import build_assistant_tool_schemas
from app.workspace.constants.workspace_defaults import ALLOWED_CALENDAR_TYPES
from app.workspace.services.assistant_tool_spec_builder import AssistantToolSpecBuilder

# Enum không lấy từ model (tham số lọc của tool đọc), khai tường minh để test biết là chủ đích.
NON_MODEL_ENUMS: tuple[frozenset[str], ...] = (
    frozenset(ALLOWED_CALENDAR_TYPES),
    frozenset({"today", "overdue", "week", "all"}),
    frozenset(DELETE_RESOURCE_PERMISSION_MAP.keys()),
    # Loại tài nguyên của tool chung lấy từ registry (không phải choices model).
    frozenset(ASSISTANT_RECORD_RESOURCES),
)


def _iter_enums(node: Any, path: str) -> Iterator[tuple[str, list[str]]]:
    if isinstance(node, dict):
        if isinstance(node.get("enum"), list):
            yield path, [str(item) for item in node["enum"]]
        for key, value in node.items():
            yield from _iter_enums(value, f"{path}.{key}")
    elif isinstance(node, list):
        for idx, value in enumerate(node):
            yield from _iter_enums(value, f"{path}[{idx}]")


def _model_choice_sets() -> list[frozenset[str]]:
    result: list[frozenset[str]] = []
    for model in apps.get_models():
        for field in model._meta.get_fields():
            choices = getattr(field, "choices", None)
            if isinstance(field, models.Field) and choices:
                result.append(frozenset(str(value) for value, _ in choices))
    return result


class TestAssistantToolSpecs:
    def test_every_schema_enum_comes_from_model_choices_or_declared_filter(self) -> None:
        choice_sets = _model_choice_sets()
        allowed = [*choice_sets, *NON_MODEL_ENUMS]
        problems = []
        for schema in build_assistant_tool_schemas(is_owner=True, actor=None):
            name = schema["function"]["name"]
            for path, values in _iter_enums(schema["function"]["parameters"], name):
                if not any(set(values) <= candidate for candidate in allowed):
                    problems.append(f"{path}: {values}")
        assert not problems, f"Enum tool không khớp choices của model nào: {problems}"

    def test_ask_fields_and_tool_models_point_to_real_tools_and_fields(self) -> None:
        builder = AssistantToolSpecBuilder()
        tool_names = {schema["function"]["name"] for schema in build_assistant_tool_schemas(is_owner=True)}
        assert set(ASSISTANT_TOOL_MODELS) <= tool_names
        for tool, declarations in ASSISTANT_ASK_FIELDS.items():
            assert tool in tool_names and tool in ASSISTANT_TOOL_MODELS, tool
            spec = builder.spec_for(tool)
            assert spec is not None
            names = [slot.name for slot in spec.ask_slots]
            assert len(names) == len(set(names))
            for decl in declarations:
                # Field không có trong model (VD mật khẩu thô của link) phải tự khai câu hỏi.
                assert builder.model_field(tool, decl.name) is not None or decl.question, (
                    f"{tool}.{decl.name}"
                )
            for slot in spec.ask_slots:
                assert slot.free_text or slot.options, f"{tool}.{slot.name} thiếu lựa chọn"
                if slot.only_if is not None:
                    assert slot.only_if[0] in names

    def test_enriched_schema_carries_model_labels_and_ask_note(self) -> None:
        schemas = AssistantToolSpecBuilder().enrich_schemas(build_assistant_tool_schemas(is_owner=True))
        reminder = next(item for item in schemas if item["function"]["name"] == "create_quick_reminder")
        props = reminder["function"]["parameters"]["properties"]
        assert "Không lặp" in props["recurrence"]["description"]
        assert "không tự điền" in reminder["function"]["description"]

    def test_every_create_tool_declares_ask_fields_or_a_reason_not_to_ask(self) -> None:
        create_tools = {
            schema["function"]["name"]
            for schema in build_assistant_tool_schemas(is_owner=True)
            if schema["function"]["name"].startswith("create_")
        }
        asked = set(ASSISTANT_ASK_FIELDS)
        skipped = set(ASSISTANT_NO_ASK_TOOLS)
        assert not (asked & skipped), asked & skipped
        assert create_tools == asked | skipped, create_tools ^ (asked | skipped)
        assert all(reason.strip() for reason in ASSISTANT_NO_ASK_TOOLS.values())
        assert set(ASSISTANT_TOOL_MODELS) >= create_tools
