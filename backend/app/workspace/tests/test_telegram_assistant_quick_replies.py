"""Telegram: câu hỏi lựa chọn hiện nút inline, ô gõ tự do mở force_reply, mật khẩu được bảo vệ."""

from typing import Any
from unittest.mock import patch

import pytest

from app.system.models.telegram_chat import TelegramChat
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.system.types.telegram_send_result import TelegramSendResult
from app.utilities.models.short_link import ShortLink
from app.utilities.permissions.short_link_permission import ShortLinkPermission
from app.workspace.permissions.assistant_permission import AssistantPermission
from app.workspace.services.assistant_config_service import AssistantConfigService
from app.workspace.services.telegram_assistant_reply_service import TelegramAssistantReplyService
from app.workspace.services.telegram_assistant_router_service import TelegramAssistantRouterService

pytestmark = pytest.mark.django_db
DM_ID = "111001"
GROUP_ID = "-100777"
CLIENT = "app.system.services.telegram_client.TelegramClient"


def _tool_call() -> dict[str, Any]:
    return {
        "ok": True,
        "model": "m",
        "tokens": 10,
        "fallback_attempts": 0,
        "message": {
            "content": "",
            "tool_calls": [
                {
                    "id": "c1",
                    "type": "function",
                    "function": {
                        "name": "create_short_link",
                        "arguments": '{"destination_url": "https://www.facebook.com/"}',
                    },
                }
            ],
        },
    }


def _text_update(
    text: str, *, chat_id: str = DM_ID, chat_type: str = "private", sender: int = 111001
) -> dict:
    return {
        "update_id": 1,
        "message": {
            "message_id": 50,
            "text": text,
            "from": {"id": sender, "username": "owner"},
            "chat": {"id": int(chat_id), "type": chat_type},
        },
    }


def _callback_update(
    sent_markup: dict[str, Any], data: str, *, sender: int = 111001, chat_id: str = DM_ID
) -> dict:
    return {
        "update_id": 2,
        "callback_query": {
            "id": "cb-1",
            "data": data,
            "from": {"id": sender, "username": "owner"},
            "message": {
                "message_id": 99,
                "chat": {"id": int(chat_id), "type": "private" if chat_id == DM_ID else "supergroup"},
                "reply_markup": sent_markup,
            },
        },
    }


class FakeTelegram:
    """Ghi lại mọi lời gọi Bot API để kiểm nút, xác nhận lựa chọn và xóa tin."""

    def __init__(self) -> None:
        self.sent: list[dict[str, Any]] = []
        self.answered: list[tuple[str, str]] = []
        self.cleared: list[int] = []
        self.deleted: list[int] = []

    def send(self, token: str, chat_id: str, text: str, **kwargs: Any) -> TelegramSendResult:
        self.sent.append({"chat_id": chat_id, "text": text, **kwargs})
        return TelegramSendResult(ok=True, message_id="99")

    def answer(self, token: str, callback_id: str, text: str = "") -> bool:
        self.answered.append((callback_id, text))
        return True

    def clear(self, token: str, chat_id: str, message_id: int) -> bool:
        self.cleared.append(message_id)
        return True

    def delete(self, token: str, chat_id: str, message_id: int) -> bool:
        self.deleted.append(message_id)
        return True


@pytest.fixture
def owner(user: Any, settings: Any) -> Any:
    settings.TELEGRAM_BOT_TOKEN = "123:TG"  # noqa: S105 - giá trị test
    settings.TELEGRAM_BOT_USERNAME = "helper_bot"
    settings.XKIRO_API_BASE = "https://xkiro.example.com/v1"
    settings.XKIRO_API_KEY = "k"
    settings.XKIRO_MODEL = "m"
    settings.FRONTEND_URL = "https://toannx.com"
    grant(user, AssistantPermission.CHAT, ShortLinkPermission.CREATE, ShortLinkPermission.READ)
    AssistantConfigService().update_config(
        user, {"telegram_ai_enabled": True, "telegram_group_require_mention": True}
    )
    TelegramChat.objects.create(
        owner=user,
        chat_id=DM_ID,
        chat_type="private",
        title="DM",
        status=TelegramChat.Status.ACTIVE,
        is_active=True,
    )
    return type(user).objects.get(pk=user.pk)


def _run(
    fake: FakeTelegram, updates: list[dict[str, Any]], llm: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    router = TelegramAssistantRouterService()
    with (
        patch(f"{CLIENT}.send_message", side_effect=fake.send),
        patch(f"{CLIENT}.answer_callback_query", side_effect=fake.answer),
        patch(f"{CLIENT}.clear_inline_keyboard", side_effect=fake.clear),
        patch(f"{CLIENT}.delete_message", side_effect=fake.delete),
        patch("app.workspace.services.xkiro_client.XkiroClient.chat_completion", side_effect=llm),
    ):
        return [router.process_async_update(update) for update in updates]


class TestReplyMarkup:
    def test_options_become_inline_keyboard_two_per_row(self) -> None:
        markup = TelegramAssistantReplyService().build_reply_markup(
            [{"caption": "A", "text": "A"}, {"caption": "B", "text": "B"}, {"caption": "C", "text": "C"}],
            None,
        )
        assert markup == {
            "inline_keyboard": [
                [{"text": "A", "callback_data": "aqr:1"}, {"text": "B", "callback_data": "aqr:2"}],
                [{"text": "C", "callback_data": "aqr:3"}],
            ]
        }

    def test_free_input_opens_force_reply_with_placeholder(self) -> None:
        markup = TelegramAssistantReplyService().build_reply_markup(
            None, {"kind": "secret", "unit": "", "placeholder": "Nhập mật khẩu…"}
        )
        assert markup == {"force_reply": True, "selective": True, "input_field_placeholder": "Nhập mật khẩu…"}

    def test_plain_reply_has_no_markup(self) -> None:
        assert TelegramAssistantReplyService().build_reply_markup(None, None) is None


class TestTelegramChoiceFlow:
    def test_buttons_drive_short_link_creation_without_extra_llm(self, owner: Any) -> None:
        fake = FakeTelegram()
        _run(fake, [_text_update("tạo link rút gọn tới https://www.facebook.com/")], [_tool_call()])
        first_markup = fake.sent[-1]["reply_markup"]
        captions = [button["text"] for row in first_markup["inline_keyboard"] for button in row]
        assert captions[:2] == ["Chờ bấm nút", "Chuyển ngay (1 giây)"]

        _run(fake, [_callback_update(first_markup, "aqr:2")], [])
        assert fake.answered[-1] == ("cb-1", "Đã chọn: Chuyển ngay (1 giây)")
        assert fake.cleared == [99]
        second_markup = fake.sent[-1]["reply_markup"]
        assert [button["text"] for row in second_markup["inline_keyboard"] for button in row] == [
            "Không đặt mật khẩu",
            "Đặt mật khẩu",
        ]

        _run(fake, [_callback_update(second_markup, "aqr:1")], [])
        link = ShortLink.objects.get(owner=owner)
        assert link.auto_redirect_seconds == 1
        assert not link.password_hash
        assert f"https://toannx.com/s/{link.slug}" in fake.sent[-1]["text"]
        # Telegram không vẽ thẻ: đúng một dòng link xem lại trong Portal.
        assert fake.sent[-1]["text"].count("/vi/ca-nhan/link-rut-gon/") == 1
        assert "reply_markup" not in fake.sent[-1]

    def test_password_prompt_uses_force_reply_and_typed_secret_is_deleted(self, owner: Any) -> None:
        fake = FakeTelegram()
        _run(
            fake, [_text_update("tạo link rút gọn tới https://www.facebook.com/ chuyển ngay")], [_tool_call()]
        )
        _run(fake, [_callback_update(fake.sent[-1]["reply_markup"], "aqr:2")], [])
        assert fake.sent[-1]["reply_markup"]["force_reply"] is True
        _run(fake, [_text_update("MatKhau#2026")], [])
        assert fake.deleted == [50]
        assert ShortLink.objects.get(owner=owner).password_hash

    def test_unknown_or_stale_button_is_ignored(self, owner: Any) -> None:
        fake = FakeTelegram()
        result = _run(fake, [_callback_update({"inline_keyboard": []}, "aqr:9")], [])
        assert result[0]["handled"] is False
        assert fake.sent == []


class TestTelegramGroupChoices:
    @pytest.fixture
    def group(self, owner: Any) -> Any:
        TelegramChat.objects.create(
            owner=owner,
            chat_id=GROUP_ID,
            chat_type="supergroup",
            title="Nhóm",
            status=TelegramChat.Status.ACTIVE,
            is_active=True,
        )
        return owner

    def test_other_member_cannot_press_owner_choice(self, group: Any) -> None:
        stranger = UserFactory()
        TelegramChat.objects.create(
            owner=stranger,
            chat_id="222002",
            chat_type="private",
            title="DM lạ",
            status=TelegramChat.Status.ACTIVE,
            is_active=True,
        )
        fake = FakeTelegram()
        markup = {"inline_keyboard": [[{"text": "Chờ bấm nút", "callback_data": "aqr:1"}]]}
        result = _run(fake, [_callback_update(markup, "aqr:1", sender=222002, chat_id=GROUP_ID)], [])
        assert result[0]["reason"] == "choice_not_owner"
        assert fake.answered == [("cb-1", "Chỉ chủ sở hữu mới chọn được mục này.")]
        assert fake.sent == []

    def test_group_never_collects_password(self, group: Any) -> None:
        fake = FakeTelegram()
        _run(
            fake,
            [
                _text_update(
                    "@helper_bot tạo link rút gọn tới https://www.facebook.com/ chuyển ngay",
                    chat_id=GROUP_ID,
                    chat_type="supergroup",
                )
            ],
            [_tool_call()],
        )
        markup = fake.sent[-1]["reply_markup"]
        _run(fake, [_callback_update(markup, "aqr:2", chat_id=GROUP_ID)], [])
        assert "tin nhắn riêng" in fake.sent[-1]["text"]
        assert "reply_markup" not in fake.sent[-1]
        assert not ShortLink.objects.filter(owner=group).exists()
