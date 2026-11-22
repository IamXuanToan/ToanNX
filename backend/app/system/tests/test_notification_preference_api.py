"""Tùy chọn thông báo: chỉ sự kiện có quyền, khóa IN_APP của sự kiện lỗi, chat phải của mình."""

from typing import Any

import pytest

from app.system.models.telegram_bot import TelegramBot
from app.system.models.telegram_chat import TelegramChat
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/notifications/preferences"


def test_matrix_only_allowed_events(login: Any) -> None:
    member = UserFactory()
    grant(member, "system.notification_preference.read", "system.notification_preference.update")
    codes = {item["event"]["code"] for item in login(member).get(URL).json()["data"]["items"]}
    assert "system.auth.login" in codes and "finance.income.received" not in codes


def test_update_rules(superuser: Any, login: Any) -> None:
    api = login(superuser)
    ok = api.put(
        URL, {"items": [{"event_code": "system.auth.login", "in_app": True, "email": True}]}, format="json"
    )
    item = next(row for row in ok.json()["data"]["items"] if row["event"]["code"] == "system.auth.login")
    assert item["email"] is True
    locked = api.put(
        URL,
        {"items": [{"event_code": "system.notification.delivery_failed", "in_app": False}]},
        format="json",
    )
    assert locked.json()["error"]["code"] == "NOTIFICATION_IN_APP_REQUIRED"
    other = UserFactory()
    bot = TelegramBot.objects.create(owner=other, token_encrypted="x", token_last4="1234")
    chat = TelegramChat.objects.create(owner=other, bot=bot, chat_id="1", status="active")
    foreign = api.put(
        URL,
        {"items": [{"event_code": "system.auth.login", "in_app": True, "telegram_chat_ids": [str(chat.pk)]}]},
        format="json",
    )
    assert foreign.json()["error"]["code"] == "NOTIFICATION_CHAT_INVALID"


def test_forbidden_event(login: Any) -> None:
    member = UserFactory()
    grant(member, "system.notification_preference.read", "system.notification_preference.update")
    response = login(member).put(
        URL, {"items": [{"event_code": "finance.income.received", "in_app": True}]}, format="json"
    )
    assert response.json()["error"]["code"] == "NOTIFICATION_EVENT_FORBIDDEN"
