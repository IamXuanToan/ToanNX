"""Bot Telegram riêng: lưu mã hóa, token sai, bot đặt webhook, đăng ký chat, gửi bằng bot của chủ."""

from typing import Any
from unittest.mock import patch

import pytest

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.system.constants.notification_error_code import NotificationErrorCode
from app.system.models.notification_delivery import NotificationDelivery
from app.system.models.notification_preference import NotificationPreference
from app.system.models.telegram_bot import TelegramBot
from app.system.models.telegram_chat import TelegramChat
from app.system.services.notification_service import NotificationService
from app.system.types.notification_payload import NotificationPayload
from app.system.types.telegram_send_result import TelegramSendResult

pytestmark = pytest.mark.django_db
CLIENT = "app.system.services.telegram_client.TelegramClient"
ME = {"id": 42, "username": "toannx_bot", "first_name": "Bot"}


def _save_bot(api: Any) -> Any:
    with patch(f"{CLIENT}.get_me", return_value=ME):
        return api.put("/api/v1/system/telegram/bot", {"token": "123:SECRET-TOKEN"}, format="json")


def test_save_bot_encrypts_token(superuser: Any, login: Any) -> None:
    response = _save_bot(login(superuser))
    data = response.json()["data"]
    assert data["username"] == "toannx_bot" and data["token_last4"] == "OKEN" and "token" not in data
    assert "SECRET" not in TelegramBot.objects.get().token_encrypted


def test_invalid_token(superuser: Any, login: Any) -> None:
    error = BusinessRuleError("x", code=NotificationErrorCode.TELEGRAM_BOT_TOKEN_INVALID)
    with patch(f"{CLIENT}.get_me", side_effect=error):
        response = login(superuser).put("/api/v1/system/telegram/bot", {"token": "bad"}, format="json")
    assert (
        response.json()["error"]["code"] == "TELEGRAM_BOT_TOKEN_INVALID" and not TelegramBot.objects.exists()
    )


def test_bot_with_webhook(superuser: Any, login: Any) -> None:
    api = login(superuser)
    _save_bot(api)
    with (
        patch(f"{CLIENT}.get_me", return_value=ME),
        patch(f"{CLIENT}.get_webhook_info", return_value={"url": "https://x"}),
    ):
        assert api.post("/api/v1/system/telegram/bot/check").json()["data"]["has_webhook"] is True


def test_register_requires_bot_then_verifies(superuser: Any, login: Any) -> None:
    api = login(superuser)
    assert (
        api.post("/api/v1/system/telegram-chats/register", {}, format="json").json()["error"]["code"]
        == "TELEGRAM_BOT_REQUIRED"
    )
    _save_bot(api)
    registration = api.post(
        "/api/v1/system/telegram-chats/register", {"kind": "private"}, format="json"
    ).json()["data"]
    assert "?start=" in registration["link"]
    updates = [
        {
            "message": {
                "text": f"/start {registration['code']}",
                "chat": {"id": 99, "type": "private", "first_name": "A"},
            }
        }
    ]
    with (
        patch(f"{CLIENT}.get_updates", return_value=updates),
        patch(f"{CLIENT}.send_message", return_value=TelegramSendResult(ok=True)),
    ):
        chat = api.post(f"/api/v1/system/telegram-chats/{registration['chat']['id']}/verify").json()["data"]
    assert chat["status"] == "active" and chat["chat_id"] == "99"


def test_delivery_uses_owner_bot_and_skips_when_bot_deleted(superuser: Any, login: Any) -> None:
    api = login(superuser)
    _save_bot(api)
    bot = TelegramBot.objects.get()
    chat = TelegramChat.objects.create(owner=superuser, bot=bot, chat_id="99", status="active")
    NotificationPreference.objects.create(
        user=superuser, event_code="system.auth.login", channel="TELEGRAM", telegram_chat=chat
    )
    with patch(f"{CLIENT}.send_message", return_value=TelegramSendResult(ok=True, message_id="1")) as send:
        NotificationService().notify(
            "system.auth.login", recipient=superuser, dedup_key="a", payload=NotificationPayload(title="t")
        )
        NotificationService().dispatch_pending()
    assert (
        send.call_args.args[0] == "123:SECRET-TOKEN" and NotificationDelivery.objects.get().status == "SENT"
    )
    NotificationService().notify(
        "system.auth.login", recipient=superuser, dedup_key="b", payload=NotificationPayload(title="t")
    )
    api.delete("/api/v1/system/telegram/bot")
    NotificationService().dispatch_pending()
    assert not NotificationDelivery.objects.filter(status="PENDING").exists()
