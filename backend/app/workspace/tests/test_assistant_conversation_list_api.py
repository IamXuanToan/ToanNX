"""Kiểm thử danh sách Hội thoại Trợ lý AI: GET /api/v1/workspace/assistant/conversations."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.assistant_message import AssistantMessage
from app.workspace.permissions.assistant_conversation_permission import (
    AssistantConversationPermission as P,
)

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/assistant/conversations"


class TestAssistantConversationListApi(BaseApiTestCase):
    """Kiểm thử danh sách hội thoại gọn (`message_count`), lọc kênh & chặn tạo trực tiếp."""

    def test_list_filter_and_deny_create(self, user: Any, login: Any, client: Any) -> None:
        other = UserFactory()
        c1 = AssistantConversation.objects.create(
            owner=user, channel=AssistantConversation.Channel.WEB, title="Hỏi chi tiêu"
        )
        AssistantMessage.objects.create(conversation=c1, role="USER", content="Hello")
        AssistantConversation.objects.create(
            owner=other, channel=AssistantConversation.Channel.TELEGRAM_DM, title="Khác"
        )

        self.assert_unauthorized(client.get(URL))
        self.assert_forbidden(login(user).get(URL), "PERMISSION_DENIED")

        grant(user, P.READ)
        api = login(user)
        items, pag = self.assert_paginated(api.get(URL, {"channel": "WEB", "page": 1}))
        assert pag["total"] == 1
        assert items[0]["message_count"] == 1
        assert "recent_messages" not in items[0]
        self.assert_forbidden(api.post(URL, {}, format="json"), "PERMISSION_DENIED")
