"""Bot Telegram chung ENV: GET metadata cho member, POST check chỉ Setting.UPDATE, đăng ký & gửi Telegram."""

from typing import Any
from unittest.mock import patch

import pytest

from app.system.models.notification_delivery import NotificationDelivery
from app.system.models.notification_preference import NotificationPreference
from app.system.models.telegram_chat import TelegramChat
from app.system.services.notification_service import NotificationService
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.system.types.notification_payload import NotificationPayload
from app.system.types.telegram_send_result import TelegramSendResult

pytestmark = pytest.mark.django_db
CLIENT = "app.system.services.telegram_client.TelegramClient"
ME = {"id": 42, "username": "system_helper_bot", "first_name": "HelperBot"}


def test_get_bot_info_unconfigured_then_configured_for_regular_user(
    user: Any, login: Any, settings: Any, fake_redis: Any
) -> None:
    api = login(user)
    unconfigured = api.get("/api/v1/system/telegram/bot").json()["data"]
    assert unconfigured == {"configured": False, "username": "", "display_name": "", "bot_url": ""}

    settings.TELEGRAM_BOT_TOKEN = "123:SECRET-TOKEN"
    settings.TELEGRAM_BOT_USERNAME = "@system_helper_bot"
    data = api.get("/api/v1/system/telegram/bot").json()["data"]
    assert data["configured"] is True
    assert data["username"] == "system_helper_bot"
    assert data["bot_url"] == "https://t.me/system_helper_bot"


def test_check_webhook_requires_setting_update_and_syncs_webhook(
    user: Any, login: Any, settings: Any
) -> None:
    settings.TELEGRAM_BOT_TOKEN = "123:SECRET-TOKEN"
    api = login(user)
    assert api.post("/api/v1/system/telegram/bot/check").status_code == 403

    settings.TELEGRAM_BOT_TOKEN = "123:SECRET-TOKEN"
    grant(user, "system.setting.update")
    user = type(user).objects.get(pk=user.pk)
    api = login(user)
    with (
        patch(f"{CLIENT}.get_me", return_value=ME),
        patch(f"{CLIENT}.get_webhook_info", return_value={"url": ""}),
    ):
        local_res = api.post("/api/v1/system/telegram/bot/check")
    assert local_res.status_code == 200
    assert local_res.json()["data"]["last_error_code"] == "TELEGRAM_WEBHOOK_HTTPS_REQUIRED"

    with (
        patch(f"{CLIENT}.get_me", return_value=ME),
        patch(f"{CLIENT}.set_webhook", return_value=True) as set_wh,
        patch(
            f"{CLIENT}.get_webhook_info",
            return_value={"url": "https://api.example.com/api/v1/system/telegram/webhook"},
        ),
    ):
        res = api.post("/api/v1/system/telegram/bot/check", secure=True)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["webhook_active"] is True
    assert data["bot"]["username"] == "system_helper_bot"
    assert "secret_token" in set_wh.call_args.kwargs


def test_register_verify_admin_manage_all_and_delivery_uses_env_bot(
    superuser: Any, login: Any, settings: Any
) -> None:
    member = UserFactory()
    grant(member, "system.telegram_chat.read", "system.telegram_chat.create", "system.telegram_chat.update")
    member_api = login(member)

    missing_res = member_api.post("/api/v1/system/telegram-chats/register", {}, format="json")
    assert missing_res.status_code == 422
    assert missing_res.json()["error"]["code"] == "TELEGRAM_BOT_MISSING"

    settings.TELEGRAM_BOT_TOKEN = "123:SECRET-TOKEN"
    settings.TELEGRAM_BOT_USERNAME = "system_helper_bot"
    registration = member_api.post(
        "/api/v1/system/telegram-chats/register", {"kind": "private"}, format="json"
    ).json()["data"]
    assert registration["link"] == f"https://t.me/system_helper_bot?start={registration['code']}"

    updates = [
        {
            "message": {
                "text": f"/start {registration['code']}",
                "chat": {"id": 99, "type": "private", "first_name": "Member"},
            }
        }
    ]
    with (
        patch(f"{CLIENT}.get_updates", return_value=updates),
        patch(f"{CLIENT}.send_message", return_value=TelegramSendResult(ok=True)),
    ):
        verified = login(superuser).post(f"/api/v1/system/telegram-chats/{registration['chat']['id']}/verify")
    assert verified.status_code == 200
    assert verified.json()["data"]["status"] == "active"

    chat = TelegramChat.objects.get(pk=registration["chat"]["id"])
    NotificationPreference.objects.create(
        user=member, event_code="system.auth.login", channel="TELEGRAM", telegram_chat=chat
    )
    with patch(f"{CLIENT}.send_message", return_value=TelegramSendResult(ok=True, message_id="1")) as send:
        NotificationService().notify(
            "system.auth.login", recipient=member, dedup_key="k1", payload=NotificationPayload(title="Hello")
        )
        NotificationService().dispatch_pending()
    assert send.call_args.args[0] == "123:SECRET-TOKEN"
    assert NotificationDelivery.objects.get().status == "SENT"

    # Tắt bot ENV -> dispatch bỏ qua sạch
    settings.TELEGRAM_BOT_TOKEN = ""
    NotificationService().notify(
        "system.auth.login", recipient=member, dedup_key="k2", payload=NotificationPayload(title="Hello2")
    )
    assert NotificationDelivery.objects.filter(status="PENDING").count() == 0
