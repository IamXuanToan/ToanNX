"""Kiểm thử cập nhật chế độ phản hồi nhóm Telegram (`PATCH /api/v1/system/telegram-chats/{id}`)."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.telegram_chat import TelegramChat
from app.system.permissions.telegram_chat_permission import TelegramChatPermission
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db


class TestTelegramChatGroupModeApi(BaseApiTestCase):
    """Kiểm thử chuyển đổi 2 chế độ nhóm Telegram (`mention_only` ↔ `all_messages`)."""

    def test_update_group_reply_mode(self, user: Any, login: Any) -> None:
        grant(user, TelegramChatPermission.READ, TelegramChatPermission.UPDATE)
        api = login(user)
        chat = TelegramChat.objects.create(
            owner=user,
            chat_id="-10012345",
            chat_type="group",
            title="Nhóm 2 thành viên",
            status=TelegramChat.Status.ACTIVE,
            is_active=True,
        )
        res = api.patch(
            f"/api/v1/system/telegram-chats/{chat.pk}",
            {"group_reply_mode": TelegramChat.GroupReplyMode.ALL_MESSAGES},
            format="json",
        )
        data = self.assert_success(res)
        assert data["group_reply_mode"] == TelegramChat.GroupReplyMode.ALL_MESSAGES
        chat.refresh_from_db()
        assert chat.group_reply_mode == TelegramChat.GroupReplyMode.ALL_MESSAGES
