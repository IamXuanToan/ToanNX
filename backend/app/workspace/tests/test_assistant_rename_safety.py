"""Regression: "đổi tên cái vừa tạo" từng đổi nhầm TÊN HỒ SƠ người dùng và lộ markup tool-call ra chat."""

from typing import Any
from unittest.mock import patch

import pytest
from django.utils import timezone

from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.assistant_message import AssistantMessage
from app.workspace.models.reminder import Reminder
from app.workspace.permissions.assistant_permission import AssistantPermission
from app.workspace.permissions.reminder_permission import ReminderPermission
from app.workspace.services.assistant_reply_guard import AssistantReplyGuard
from app.workspace.services.assistant_result_card_builder import AssistantResultCardBuilder
from app.workspace.services.assistant_service import AssistantService
from app.workspace.services.assistant_tools_service import AssistantToolsService

pytestmark = pytest.mark.django_db
WEB = AssistantConversation.Channel.WEB


def _tool(name: str, arguments: str, content: str = "") -> dict[str, Any]:
    return {
        "ok": True,
        "model": "m",
        "tokens": 5,
        "fallback_attempts": 0,
        "message": {
            "content": content,
            "tool_calls": [
                {"id": "c1", "type": "function", "function": {"name": name, "arguments": arguments}}
            ],
        },
    }


def _text(text: str) -> dict[str, Any]:
    return {"ok": True, "model": "m", "tokens": 3, "fallback_attempts": 0, "message": {"content": text}}


@pytest.fixture
def actor(user: Any) -> Any:
    grant(user, AssistantPermission.CHAT, ReminderPermission.READ, ReminderPermission.UPDATE)
    user.full_name = "Toàn Nguyễn"
    user.save(update_fields=["full_name"])
    return type(user).objects.get(pk=user.pk)


def _seed_created_reminder(actor: Any) -> tuple[AssistantConversation, Reminder]:
    """Hội thoại có thẻ "vừa tạo nhắc việc" như sau một lượt tạo thật."""
    reminder = Reminder.objects.create(owner=actor, title="Họp team dự án", due_date=timezone.localdate())
    conv = AssistantService().conversation_service.get_or_create_active(actor, channel=WEB)
    AssistantMessage.objects.create(conversation=conv, role="USER", content="Tạo nhắc họp team dự án")
    AssistantMessage.objects.create(
        conversation=conv,
        role="ASSISTANT",
        content="✅ Đã tạo nhắc việc Họp team dự án",
        metadata={
            "cards": [
                {"type": "reminder", "action": "created", "id": str(reminder.pk), "title": "Họp team dự án"}
            ]
        },
    )
    return conv, reminder


class TestRenameJustCreatedRecord:
    def test_router_keeps_update_tool_of_recent_record_and_profile_is_not_renamed(self, actor: Any) -> None:
        _, reminder = _seed_created_reminder(actor)
        svc = AssistantService()
        offered: list[set[str]] = []

        def model(messages: Any, **kwargs: Any) -> dict[str, Any]:
            if kwargs.get("tools"):
                offered.append({tool["function"]["name"] for tool in kwargs["tools"]})
            if len(offered) == 1:
                # Model "nhầm" như sự cố thật: gọi đổi tên hồ sơ + in markup DSML vào nội dung.
                return _tool(
                    "update_my_profile",
                    '{"full_name": "Họp sprint review"}',
                    content="</ | DSML | invoke>\n</ | DSML | tool_calls>",
                )
            if len(offered) == 2:
                return _tool(
                    "update_reminder", f'{{"reminder_id": "{reminder.pk}", "title": "Họp sprint review"}}'
                )
            return _text("Đã đổi tên nhắc việc.")

        with (
            patch.object(svc.xkiro_client, "is_configured", return_value=True),
            patch.object(svc.xkiro_client, "chat_completion", side_effect=model),
        ):
            res = svc.chat(actor, "đổi tên cái vừa tạo thành Họp sprint review", channel=WEB)

        assert "update_reminder" in offered[0]
        actor.refresh_from_db()
        assert actor.full_name == "Toàn Nguyễn"
        reminder.refresh_from_db()
        assert reminder.title == "Họp sprint review"
        assert "DSML" not in res["reply"]
        assert "/vi/ca-nhan/" not in res["reply"]
        assert res["message"].metadata["cards"][0]["view_url"].endswith(f"/nhac-viec/{reminder.pk}")

    def test_profile_rename_still_works_when_user_says_so(self, actor: Any) -> None:
        result = AssistantToolsService().execute_tool(
            actor,
            "update_my_profile",
            {"full_name": "Nguyễn Xuân Toàn"},
            is_owner=True,
            user_text="đổi tên hiển thị của tôi thành Nguyễn Xuân Toàn",
        )
        assert result["ok"] is True
        actor.refresh_from_db()
        assert actor.full_name == "Nguyễn Xuân Toàn"

    def test_profile_rename_rejected_without_profile_intent(self, actor: Any) -> None:
        result = AssistantToolsService().execute_tool(
            actor,
            "update_my_profile",
            {"full_name": "Họp sprint"},
            is_owner=True,
            user_text="đổi tên thành Họp sprint",
        )
        assert result["ok"] is False
        actor.refresh_from_db()
        assert actor.full_name == "Toàn Nguyễn"


class TestToolMarkupStripping:
    @pytest.mark.parametrize(
        "leak",
        [
            "</ | DSML | invoke>",
            '<｜DSML｜invoke name="update_reminder">',
            "| parameter>",
            "</tool_calls>",
            "<function_calls>",
        ],
    )
    def test_markup_lines_removed_and_text_kept(self, leak: str) -> None:
        text = f"Đã đổi tên.\n{leak}\nXem lại bên dưới."
        assert AssistantReplyGuard().strip_tool_markup(text) == "Đã đổi tên.\nXem lại bên dưới."


class TestCardDedup:
    def test_same_record_updated_twice_yields_one_card_and_no_link_in_text(self) -> None:
        out = {"ok": True, "updated": {"id": "r-1", "title": "Họp sprint"}}
        cards = AssistantResultCardBuilder().build([("update_reminder", out), ("update_reminder", out)])
        assert len(cards) == 1
        svc = AssistantService()
        url = cards[0]["view_url"]
        lead = (
            f"✅ Đã đổi tên thành **Họp sprint**.\n\n[Xem chi tiết]({url})\n\n"
            f"🔗 [Xem chi tiết nhắc việc]({url})\n**Link xem chi tiết:** {url}"
        )
        assert svc._compose_with_cards(lead, cards) == "✅ Đã đổi tên thành **Họp sprint**."
        assert url not in svc._compose_with_cards("Đã đổi tên.", cards)

    def test_model_link_with_record_name_keeps_name_as_text(self) -> None:
        out = {"ok": True, "created": {"id": "r-2", "title": "Đóng tiền nước"}}
        cards = AssistantResultCardBuilder().build([("create_quick_reminder", out)])
        url = cards[0]["view_url"]
        text = f"Đã tạo nhắc việc [Đóng tiền nước]({url}) lúc 05:10, [mở tại đây]({url}) nhé."
        assert AssistantResultCardBuilder().strip_view_links(text, cards) == (
            "Đã tạo nhắc việc Đóng tiền nước lúc 05:10, nhé."
        )

    def test_other_urls_are_kept(self) -> None:
        out = {"ok": True, "updated": {"id": "p-1", "title": "Trang"}}
        cards = AssistantResultCardBuilder().build([("update_page", out)])
        text = "Địa chỉ mới: https://toannx.com/kp/abc"
        assert AssistantResultCardBuilder().strip_view_links(text, cards) == text

    def test_empty_lead_falls_back_to_confirmation_without_link(self) -> None:
        out = {"ok": True, "created": {"id": "r-3", "title": "Đóng tiền nước"}}
        cards = AssistantResultCardBuilder().build([("create_quick_reminder", out)])
        text = AssistantService()._compose_with_cards(f"[Xem chi tiết]({cards[0]['view_url']})", cards)
        assert text == "✅ Đã tạo nhắc việc **Đóng tiền nước**."

    def test_telegram_link_lines_have_one_link_per_card(self) -> None:
        out = {"ok": True, "created": {"id": "r-4", "title": "Đóng tiền nước"}}
        cards = AssistantResultCardBuilder().build([("create_quick_reminder", out)])
        assert AssistantResultCardBuilder().link_lines(cards) == (
            f"🔗 [Xem chi tiết nhắc việc]({cards[0]['view_url']})"
        )
