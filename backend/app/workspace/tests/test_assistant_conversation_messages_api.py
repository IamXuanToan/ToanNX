"""Kiểm thử phân trang tin nhắn: GET /api/v1/workspace/assistant/conversations/{id}/messages."""

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


class TestAssistantConversationMessagesApi(BaseApiTestCase):
    """Kiểm thử phân trang chuẩn lịch sử cũ và cô lập owner."""

    def test_messages_pagination_and_owner_isolation(self, user: Any, login: Any) -> None:
        other = UserFactory()
        conv = AssistantConversation.objects.create(owner=user, title="Chat")
        other_conv = AssistantConversation.objects.create(owner=other, title="Other")
        for idx in range(5):
            AssistantMessage.objects.create(conversation=conv, content=f"Tin {idx}")

        grant(user, P.READ)
        api = login(user)
        items, pag = self.assert_paginated(
            api.get(
                f"/api/v1/workspace/assistant/conversations/{conv.pk}/messages", {"page": 1, "page_size": 2}
            )
        )
        assert pag["total"] == 5
        assert len(items) == 2

        self.assert_error(
            api.get(f"/api/v1/workspace/assistant/conversations/{other_conv.pk}/messages"),
            404,
            "NOT_FOUND",
        )
