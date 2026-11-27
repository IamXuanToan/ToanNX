"""Kiểm thử Telegram hai chiều async & routing: POST /api/v1/workspace/assistant/telegram-process."""

from typing import Any
from unittest.mock import patch

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.telegram_chat import TelegramChat
from app.system.services.telegram_bot_service import TelegramBotService
from app.system.tests.factories.user_factory import UserFactory
from app.system.types.telegram_send_result import TelegramSendResult
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.assistant_message import AssistantMessage
from app.workspace.models.workspace_setting import WorkspaceSetting
from app.workspace.services.assistant_config_service import AssistantConfigService

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/assistant/telegram-process"


class TestTelegramAssistantAsyncApi(BaseApiTestCase):
    """Kiểm thử routing nhóm đa chủ sở hữu, Policy Admin (`tool_policy`, `hide_amounts`, `reply_in_dm`)."""

    def test_auth_404_and_multi_owner_group_routing_with_dm_fallback(
        self, user: Any, client: Any, settings: Any, vnd: Any
    ) -> None:
        settings.CRON_SECRET = "cron-tg-secret"  # noqa: S105 - giá trị test
        settings.TELEGRAM_BOT_TOKEN = "123:TG-BOT"  # noqa: S105 - giá trị test
        settings.TELEGRAM_BOT_USERNAME = "helper_bot"
        settings.XKIRO_API_BASE = "https://xkiro.example.com/v1"
        settings.XKIRO_API_KEY = "test-key"
        settings.XKIRO_MODEL = "gpt-4o-mini"

        assert client.post(URL, {}, format="json").status_code == 404

        owner2 = UserFactory()
        AssistantConfigService().update_config(
            user,
            {
                "telegram_ai_enabled": True,
                "telegram_group_require_mention": True,
                "telegram_group_tool_policy": "OWNER_ONLY",
                "telegram_group_hide_amounts": True,
                "telegram_group_reply_in_dm": True,
            },
        )
        group_chat_1 = TelegramChat.objects.create(
            owner=user,
            chat_id="-100999",
            chat_type="supergroup",
            title="Dev Group",
            status=TelegramChat.Status.ACTIVE,
            is_active=True,
        )
        group_chat_2 = TelegramChat.objects.create(
            owner=owner2,
            chat_id="-100999",
            chat_type="supergroup",
            title="Dev Group",
            status=TelegramChat.Status.ACTIVE,
            is_active=True,
        )
        WorkspaceSetting.objects.create(
            owner=user,
            telegram_owner_user_id=111001,
            telegram_allowed_chat_ids=[str(group_chat_1.pk)],
        )
        WorkspaceSetting.objects.create(
            owner=owner2,
            telegram_owner_user_id=222002,
            telegram_allowed_chat_ids=[str(group_chat_2.pk)],
        )

        # Gửi lệnh /spending trong nhóm có @helper_bot từ owner1 (111001) với reply_in_dm=True:
        # Mock TelegramClient.send_message trả 403 khi gửi DM → fallback gửi cảnh báo mở DM ở Group!
        calls: list[dict[str, Any]] = []

        def fake_send(
            token: str, chat_id: str, text: str, *, reply_to_message_id: int | None = None
        ) -> TelegramSendResult:
            calls.append({"chat_id": chat_id, "text": text, "reply_to": reply_to_message_id})
            if chat_id == "111001":
                return TelegramSendResult(ok=False, error_code="TELEGRAM_403")
            return TelegramSendResult(ok=True, message_id="99")

        update_payload = {
            "update": {
                "update_id": 7001,
                "message": {
                    "message_id": 55,
                    "text": "/spending@helper_bot",
                    "from": {"id": 111001, "username": "owner_one"},
                    "chat": {"id": -100999, "type": "supergroup", "title": "Dev Group"},
                },
            }
        }
        with patch("app.system.services.telegram_client.TelegramClient.send_message", side_effect=fake_send):
            res = client.post(URL, update_payload, format="json", HTTP_AUTHORIZATION="Bearer cron-tg-secret")
        data = self.assert_success(res)
        assert data["handled"] is True
        assert data["replied_in_dm"] is True
        assert calls[0]["chat_id"] == "111001"
        assert calls[1]["chat_id"] == "-100999"
        assert "t.me/helper_bot" in calls[1]["text"]

        # Kiểm tra hội thoại gắn đúng owner 1 (không lẫn sang owner 2) & tin nhắn đánh dấu private.
        conv = AssistantConversation.objects.get(owner=user, external_chat_id="-100999")
        assert AssistantConversation.objects.filter(owner=owner2).exists() is False
        assert conv.messages.filter(contains_private_data=True).exists() is True

        # Khi thành viên lạ (999999) nhắn ở nhóm chỉ còn owner1 cho phép chat,
        # Policy OWNER_ONLY buộc EXCLUDE lịch sử `contains_private_data=True` & tắt tools!
        WorkspaceSetting.objects.filter(owner=owner2).update(telegram_allowed_chat_ids=[])
        captured_messages: list[Any] = []

        def fake_xkiro(self: Any, messages: Any, **kwargs: Any) -> dict[str, Any]:
            captured_messages.append((messages, kwargs.get("tools")))
            return {"ok": True, "model": "gpt-4o-mini", "message": {"content": "Chào bạn!"}, "tokens": 5}

        guest_update = {
            "update": {
                "update_id": 7002,
                "message": {
                    "message_id": 56,
                    "text": "@helper_bot hôm nay thế nào?",
                    "from": {"id": 999999, "username": "guest"},
                    "chat": {"id": -100999, "type": "supergroup", "title": "Dev Group"},
                },
            }
        }
        with (
            patch("app.workspace.services.xkiro_client.XkiroClient.chat_completion", fake_xkiro),
            patch(
                "app.system.services.telegram_client.TelegramClient.send_message",
                return_value=TelegramSendResult(ok=True),
            ),
        ):
            self.assert_success(
                client.post(URL, guest_update, format="json", HTTP_AUTHORIZATION="Bearer cron-tg-secret")
            )
        sent_history, sent_tools = captured_messages[0]
        assert sent_tools is None
        assert all("Chi tiêu tháng" not in m["content"] for m in sent_history)

    def test_dm_verify_owner_updates_setting_via_webhook_hook(
        self, user: Any, client: Any, settings: Any
    ) -> None:
        settings.TELEGRAM_BOT_TOKEN = "123:TG-BOT"  # noqa: S105 - giá trị test
        TelegramChat.objects.create(
            owner=user,
            chat_id="555111",
            chat_type="private",
            status=TelegramChat.Status.ACTIVE,
            is_active=True,
        )
        secret = TelegramBotService().webhook_secret()
        with patch(
            "app.system.services.telegram_client.TelegramClient.send_message",
            return_value=TelegramSendResult(ok=True),
        ):
            res = client.post(
                "/api/v1/system/telegram/webhook",
                {
                    "update_id": 8801,
                    "message": {
                        "message_id": 10,
                        "text": "/verify_owner",
                        "from": {"id": 555111, "first_name": "Toan"},
                        "chat": {"id": 555111, "type": "private"},
                    },
                },
                format="json",
                HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN=secret,
            )
        assert res.status_code == 200
        ws = WorkspaceSetting.objects.get(owner=user)
        assert ws.telegram_owner_user_id == 555111
        assert AssistantMessage.Role.USER == "USER"
