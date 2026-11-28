"""Chọn tập tool gửi cho model theo nội dung câu hỏi (ít tool → model free gọi đúng hơn, tốn ít token hơn)."""

from typing import Any

from app.core.utils.text import to_ascii
from app.workspace.constants.assistant_tool_groups import CORE_TOOL_NAMES, TOOL_GROUPS
from app.workspace.constants.workspace_defaults import AI_ROUTED_TOOL_LIMIT


class AssistantToolRouter:
    """Lọc schema theo nhóm từ khóa; không nhận diện được nhóm nào thì giữ nguyên toàn bộ (an toàn)."""

    def select(
        self,
        schemas: list[dict[str, Any]] | None,
        user_text: str,
        *,
        keep_tools: tuple[str, ...] = (),
    ) -> list[dict[str, Any]] | None:
        """Trả schema thuộc nhóm lõi + nhóm khớp từ khóa + `keep_tools`; `None` giữ nguyên `None`."""
        if not schemas:
            return schemas
        normalized = f" {to_ascii(user_text or '').lower()} "
        wanted: set[str] = set(keep_tools)
        matched = False
        for keywords, tool_names in TOOL_GROUPS.values():
            if any(keyword in normalized for keyword in keywords):
                wanted.update(tool_names)
                matched = True
        if not matched:
            return schemas
        wanted.update(CORE_TOOL_NAMES)
        selected = [schema for schema in schemas if self._name(schema) in wanted]
        if len(selected) > AI_ROUTED_TOOL_LIMIT:
            return schemas
        return selected or schemas

    def _name(self, schema: dict[str, Any]) -> str:
        function = schema.get("function") if isinstance(schema, dict) else None
        return str(function.get("name") or "") if isinstance(function, dict) else ""
