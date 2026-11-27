"""Kiểm thử webhook Bot Telegram chung: secret token 404, chống trùng update_id, /start & hook registry."""

from typing import Any
from unittest.mock import patch

import pytest

from app.core.registry.module_registry import module_registry
from app.system.models.telegram_chat import TelegramChat
from app.system.services.telegram_bot_service import TelegramBotService
from app.system.types.telegram_send_result import TelegramSendResult

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/telegram/webhook"
CLIENT = "app.system.services.telegram_client.TelegramClient"


def test_webhook_rejects_missing_or_invalid_secret_with_404(client: Any, settings: Any) -> None:
    assert client.post(URL, {"update_id": 1}, format="json").status_code == 404

    settings.TELEGRAM_BOT_TOKEN = "123:SECRET"
    res = client.post(
        URL,
        {"update_id": 1},
        format="json",
        HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN="wrong-secret",
    )
    assert res.status_code == 404


def test_webhook_deduplicates_update_id_and_activates_chat(
    client: Any, user: Any, settings: Any, fake_redis: Any
) -> None:
    settings.TELEGRAM_BOT_TOKEN = "123:SECRET"
    secret = TelegramBotService().webhook_secret()
    pending = TelegramChat.objects.create(owner=user, registration_code="abc123def456")

    seen: list[int] = []

    def handler(update: dict[str, Any]) -> None:
        seen.append(int(update.get("update_id", 0)))

    module_registry.register_telegram_update_handler(handler)
    try:
        payload = {
            "update_id": 777,
            "message": {
                "text": "/start abc123def456",
                "chat": {"id": 100200, "type": "private", "first_name": "Toan"},
            },
        }
        with patch(f"{CLIENT}.send_message", return_value=TelegramSendResult(ok=True)) as send:
            first = client.post(
                URL,
                payload,
                format="json",
                HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN=secret,
            )
            duplicate = client.post(
                URL,
                payload,
                format="json",
                HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN=secret,
            )
        assert first.status_code == 200 and first.json()["data"]["duplicate"] is False
        assert duplicate.status_code == 200 and duplicate.json()["data"]["duplicate"] is True
        assert send.call_count == 1
        assert seen == [777]

        pending.refresh_from_db()
        assert pending.status == TelegramChat.Status.ACTIVE
        assert pending.chat_id == "100200"

        # Bot bị kick khỏi chat -> REMOVED
        kicked = client.post(
            URL,
            {
                "update_id": 778,
                "my_chat_member": {
                    "chat": {"id": 100200, "type": "private"},
                    "new_chat_member": {"status": "kicked"},
                },
            },
            format="json",
            HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN=secret,
        )
        assert kicked.status_code == 200
        pending.refresh_from_db()
        assert pending.status == TelegramChat.Status.REMOVED
    finally:
        module_registry._telegram_update_handlers.remove(handler)
