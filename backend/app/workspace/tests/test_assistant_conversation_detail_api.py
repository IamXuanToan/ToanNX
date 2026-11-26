"""Kiểm thử chi tiết Hội thoại Trợ lý AI: GET /api/v1/workspace/assistant/conversations/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.assistant_message import AssistantMessage
from app.workspace.permissions.assistant_conversation_permission import (
    AssistantConversationPermission as P,
)

pytestmark = pytest.mark.django_db


class TestAssistantConversationDetailApi(BaseApiTestCase):
    """Kiểm thử chỉ trả tối đa 50 tin gần nhất + cờ `has_more_messages=True` khi > 50 tin."""

    def test_detail_limits_to_50_messages_and_sets_has_more(self, user: Any, login: Any) -> None:
        conv = AssistantConversation.objects.create(owner=user, title="Chat Dài")
        AssistantMessage.objects.bulk_create(
            [
                AssistantMessage(conversation=conv, role=AssistantMessage.Role.USER, content=f"Msg {i}")
                for i in range(55)
            ]
        )
        grant(user, P.READ)
        data = self.assert_success(login(user).get(f"/api/v1/workspace/assistant/conversations/{conv.pk}"))
        assert len(data["recent_messages"]) == 50
        assert data["has_more_messages"] is True
