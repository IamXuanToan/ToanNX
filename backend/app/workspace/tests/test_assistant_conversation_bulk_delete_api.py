"""Kiểm thử xóa hàng loạt Hội thoại: POST /api/v1/workspace/assistant/conversations/bulk-delete."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.permissions.assistant_conversation_permission import (
    AssistantConversationPermission as P,
)

pytestmark = pytest.mark.django_db


class TestAssistantConversationBulkDeleteApi(BaseApiTestCase):
    """Kiểm thử bulk delete hội thoại."""

    def test_bulk_delete_success(self, user: Any, login: Any) -> None:
        conv = AssistantConversation.objects.create(owner=user, title="Xóa")
        grant(user, P.DELETE)
        data = self.assert_success(
            login(user).post(
                "/api/v1/workspace/assistant/conversations/bulk-delete",
                {"ids": [str(conv.pk)]},
                format="json",
            )
        )
        assert data["count"] == 1
