"""Kiểm thử Luồng chat Web duy nhất: GET/DELETE /api/v1/workspace/assistant/thread."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.assistant_message import AssistantMessage
from app.workspace.permissions.assistant_permission import AssistantPermission as P

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/assistant/thread"


class TestAssistantThreadApi(BaseApiTestCase):
    """Kiểm thử đọc/phân trang 1 luồng Web duy nhất, xóa sạch tin và cô lập theo `owner`."""

    def test_get_pagination_and_clear_only_own_web_thread(self, user: Any, login: Any, client: Any) -> None:
        self.assert_unauthorized(client.get(URL))
        self.assert_forbidden(login(user).get(URL), "PERMISSION_DENIED")

        grant(user, P.CHAT)
        api = login(user)

        empty_data = self.assert_success(api.get(URL))
        assert empty_data["messages"] == []
        assert empty_data["has_more_messages"] is False
        assert empty_data["total_messages"] == 0

        # Chat 2 lượt liên tiếp để tạo tin trên cùng 1 luồng Web
        self.assert_success(api.post("/api/v1/workspace/assistant/chat", {"message": "/help"}, format="json"))
        self.assert_success(
            api.post("/api/v1/workspace/assistant/chat", {"message": "/today"}, format="json")
        )

        # Tạo thêm hội thoại của user khác và Telegram DM cùng user để kiểm chứng cô lập
        other = UserFactory()
        other_web = AssistantConversation.objects.create(
            owner=other, channel=AssistantConversation.Channel.WEB
        )
        AssistantMessage.objects.create(conversation=other_web, content="Other user web")
        tg_conv = AssistantConversation.objects.create(
            owner=user, channel=AssistantConversation.Channel.TELEGRAM_DM, external_chat_id="123"
        )
        AssistantMessage.objects.create(conversation=tg_conv, content="Telegram msg")

        page1 = self.assert_success(api.get(URL, {"page": 1, "page_size": 2}))
        assert page1["total_messages"] == 4
        assert page1["has_more_messages"] is True
        assert len(page1["messages"]) == 2

        cleared = self.assert_success(api.delete(URL))
        assert cleared["deleted_count"] == 4

        after = self.assert_success(api.get(URL))
        assert after["messages"] == []
        assert after["total_messages"] == 0
        assert AssistantMessage.objects.filter(conversation=other_web).count() == 1
        assert AssistantMessage.objects.filter(conversation=tg_conv).count() == 1

        # Tin nhắn nội bộ (role=TOOL, stub tool_calls rỗng `content=""`) bị ẩn hoàn toàn khỏi GET /thread
        web_conv = AssistantConversation.objects.get(owner=user, channel=AssistantConversation.Channel.WEB)
        AssistantMessage.objects.create(
            conversation=web_conv, role=AssistantMessage.Role.USER, content="Sắp tới có gì?"
        )
        AssistantMessage.objects.create(
            conversation=web_conv,
            role=AssistantMessage.Role.ASSISTANT,
            content="",
            tool_calls=[{"id": "c1", "function": {"name": "get_upcoming_events", "arguments": "{}"}}],
        )
        AssistantMessage.objects.create(
            conversation=web_conv,
            role=AssistantMessage.Role.TOOL,
            content='{"ok": true, "total_count": 0, "items": []}',
            tool_call_id="c1",
        )
        AssistantMessage.objects.create(
            conversation=web_conv,
            role=AssistantMessage.Role.ASSISTANT,
            content="Không có sự kiện sắp tới nào.",
        )

        visible = self.assert_success(api.get(URL))
        assert visible["total_messages"] == 2
        assert [m["role"] for m in visible["messages"]] == ["USER", "ASSISTANT"]
        assert [m["content"] for m in visible["messages"]] == [
            "Sắp tới có gì?",
            "Không có sự kiện sắp tới nào.",
        ]
        # DELETE /thread vẫn dọn sạch tất cả bản ghi DB kể cả TOOL/stub ẩn
        assert self.assert_success(api.delete(URL))["deleted_count"] == 4
