"""Kiểm thử xóa Hội thoại: DELETE /api/v1/workspace/assistant/conversations/{id}."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.permissions.assistant_conversation_permission import (
    AssistantConversationPermission as P,
)

pytestmark = pytest.mark.django_db


class TestAssistantConversationDeleteApi(BaseApiTestCase):
    """Kiểm thử DELETE hội thoại."""

    def test_delete_success(self, user: Any, login: Any) -> None:
        conv = AssistantConversation.objects.create(owner=user, title="Xóa")
        grant(user, P.DELETE)
        assert login(user).delete(f"/api/v1/workspace/assistant/conversations/{conv.pk}").status_code == 204
