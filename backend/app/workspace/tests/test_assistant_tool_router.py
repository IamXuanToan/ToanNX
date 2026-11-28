"""Router chọn tool theo câu hỏi để model free không bị ngợp 40 schema."""

from app.workspace.constants.assistant_tool_groups import CORE_TOOL_NAMES
from app.workspace.constants.assistant_tool_schemas import build_assistant_tool_schemas
from app.workspace.services.assistant_tool_router import AssistantToolRouter


def _names(schemas: list[dict]) -> set[str]:
    return {schema["function"]["name"] for schema in schemas}


class TestAssistantToolRouter:
    def test_short_link_request_gets_link_tools_and_core_only(self) -> None:
        all_schemas = build_assistant_tool_schemas(is_owner=True)
        selected = AssistantToolRouter().select(all_schemas, "Tạo link rút gọn tới facebook")
        names = _names(selected or [])
        assert {"create_short_link", "update_short_link", "list_short_links"} <= names
        assert set(CORE_TOOL_NAMES) <= names
        assert "create_asset" not in names
        assert len(names) < len(all_schemas)

    def test_unknown_topic_keeps_all_tools(self) -> None:
        all_schemas = build_assistant_tool_schemas(is_owner=True)
        assert AssistantToolRouter().select(all_schemas, "ok cảm ơn nhé") == all_schemas

    def test_none_stays_none(self) -> None:
        assert AssistantToolRouter().select(None, "link") is None
