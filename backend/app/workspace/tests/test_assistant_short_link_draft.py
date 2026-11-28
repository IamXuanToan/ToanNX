"""Huấn luyện nền tảng: link rút gọn hỏi kiểu mở/mật khẩu, không bịa domain, trả lời số 0 token."""

from typing import Any
from unittest.mock import patch

import pytest

from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.short_link import ShortLink
from app.utilities.permissions.short_link_permission import ShortLinkPermission
from app.workspace.constants.workspace_defaults import ASSISTANT_MASKED_SECRET_TEXT
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.assistant_message import AssistantMessage
from app.workspace.permissions.assistant_permission import AssistantPermission
from app.workspace.services.assistant_service import AssistantService
from app.workspace.services.assistant_tools_service import AssistantToolsService

pytestmark = pytest.mark.django_db

FB_REQUEST = "Hãy cho tôi 1 link rút gọn đến https://www.facebook.com/ slug đẹp vào nhé"


def _tool_call_response(arguments: str) -> dict[str, Any]:
    return {
        "ok": True,
        "model": "free-model",
        "tokens": 20,
        "fallback_attempts": 0,
        "message": {
            "role": "assistant",
            "content": "",
            "tool_calls": [
                {
                    "id": "c1",
                    "type": "function",
                    "function": {"name": "create_short_link", "arguments": arguments},
                }
            ],
        },
    }


def _text_response(text: str) -> dict[str, Any]:
    return {
        "ok": True,
        "model": "free-model",
        "tokens": 10,
        "fallback_attempts": 0,
        "message": {"role": "assistant", "content": text},
    }


@pytest.fixture
def link_user(user: Any, settings: Any) -> Any:
    settings.FRONTEND_URL = "https://toannx.com"
    grant(user, AssistantPermission.CHAT, ShortLinkPermission.CREATE, ShortLinkPermission.READ)
    return type(user).objects.get(pk=user.pk)


class TestShortLinkDraftFlow:
    """Luồng nháp → chọn → tạo do code ép, không phụ thuộc model có nghe lời prompt hay không."""

    def test_missing_options_returns_choice_and_does_not_create(self, link_user: Any) -> None:
        svc = AssistantService()
        # Model "tế": tự điền mặc định và định tạo luôn, kèm câu trả lời có domain bịa.
        responses = [
            _tool_call_response(
                '{"destination_url":"https://www.facebook.com/","slug":"facebook-me","name":"Facebook",'
                '"auto_redirect_seconds":null}'
            ),
            _text_response("Đã tạo https://toanx.io/facebook-me"),
        ]
        with (
            patch.object(svc.xkiro_client, "is_configured", return_value=True),
            patch.object(svc.xkiro_client, "chat_completion", side_effect=responses),
        ):
            res = svc.chat(link_user, FB_REQUEST, channel=AssistantConversation.Channel.WEB)

        assert not ShortLink.objects.filter(owner=link_user).exists()
        assert "toanx.io" not in res["reply"]
        assert "chuyển hướng" in res["reply"]
        captions = [item["caption"] for item in res["message"].metadata["quick_replies"]]
        assert captions[:2] == ["Chờ bấm nút", "Chuyển ngay (1 giây)"]
        conv = AssistantConversation.objects.get(pk=res["conversation_id"])
        assert conv.pending_action["kind"] == "DRAFT"
        assert conv.pending_action["args"]["slug"] == "facebook-me"

    def test_numbered_answers_complete_draft_without_llm_and_mask_password(self, link_user: Any) -> None:
        svc = AssistantService()
        with (
            patch.object(svc.xkiro_client, "is_configured", return_value=True),
            patch.object(
                svc.xkiro_client,
                "chat_completion",
                side_effect=[
                    _tool_call_response('{"destination_url":"https://www.facebook.com/","name":"Facebook"}')
                ],
            ) as llm,
        ):
            svc.chat(link_user, FB_REQUEST, channel=AssistantConversation.Channel.WEB)
            step_redirect = svc.chat(link_user, "4", channel=AssistantConversation.Channel.WEB)
            step_password_mode = svc.chat(
                link_user, "Đặt mật khẩu", channel=AssistantConversation.Channel.WEB
            )
            done = svc.chat(link_user, "BiMat#2026", channel=AssistantConversation.Channel.WEB)
            assert llm.call_count == 1

        assert "mật khẩu" in step_redirect["reply"].lower()
        assert "Nhập mật khẩu" in step_password_mode["reply"]
        link = ShortLink.objects.get(owner=link_user)
        assert link.auto_redirect_seconds == 5
        assert link.password_hash
        assert done["message"].metadata["cards"][0]["url"] == f"https://toannx.com/s/{link.slug}"
        assert f"https://toannx.com/s/{link.slug}" in done["reply"]
        stored = list(
            AssistantMessage.objects.filter(conversation_id=done["conversation_id"], role="USER").values_list(
                "content", flat=True
            )
        )
        assert "BiMat#2026" not in stored
        assert ASSISTANT_MASKED_SECRET_TEXT in stored
        conv = AssistantConversation.objects.get(pk=done["conversation_id"])
        assert conv.pending_action is None or conv.pending_expires_at is None

    def test_explicit_options_in_request_create_directly_with_server_card(self, link_user: Any) -> None:
        svc = AssistantService()
        responses = [
            _tool_call_response('{"destination_url":"https://www.facebook.com/","slug":"fb-toan"}'),
            _text_response("Xong rồi: https://toanx.io/fb-toan"),
        ]
        with (
            patch.object(svc.xkiro_client, "is_configured", return_value=True),
            patch.object(svc.xkiro_client, "chat_completion", side_effect=responses),
        ):
            res = svc.chat(
                link_user,
                "Tạo link rút gọn tới https://www.facebook.com/ chuyển ngay, không mật khẩu, slug fb-toan",
                channel=AssistantConversation.Channel.WEB,
            )

        assert ShortLink.objects.filter(owner=link_user).exists(), res["reply"]
        link = ShortLink.objects.get(owner=link_user)
        assert link.slug == "fb-toan"
        assert link.auto_redirect_seconds == 1
        assert not link.password_hash
        assert "toanx.io" not in res["reply"]
        assert "https://toannx.com/s/fb-toan" in res["reply"]

    def test_unrelated_reply_drops_draft_and_chats_normally(self, link_user: Any) -> None:
        svc = AssistantService()
        with (
            patch.object(svc.xkiro_client, "is_configured", return_value=True),
            patch.object(
                svc.xkiro_client,
                "chat_completion",
                side_effect=[
                    _tool_call_response('{"destination_url":"https://www.facebook.com/"}'),
                    _text_response("Hôm nay trời đẹp."),
                ],
            ),
        ):
            first = svc.chat(link_user, FB_REQUEST, channel=AssistantConversation.Channel.WEB)
            second = svc.chat(
                link_user, "thời tiết hôm nay thế nào", channel=AssistantConversation.Channel.WEB
            )

        assert second["reply"] == "Hôm nay trời đẹp."
        conv = AssistantConversation.objects.get(pk=first["conversation_id"])
        assert conv.pending_action is None
        assert not ShortLink.objects.filter(owner=link_user).exists()

    def test_taken_slug_is_replaced_by_available_suggestion(self, link_user: Any) -> None:
        ShortLink.objects.create(
            owner=UserFactory(), name="x", slug="Facebook", destination_url="https://a.example/"
        )
        conv = AssistantConversation.objects.create(
            owner=link_user, channel=AssistantConversation.Channel.WEB
        )
        res = AssistantToolsService().execute_tool(
            link_user,
            "create_short_link",
            {"destination_url": "https://www.facebook.com/", "slug": "facebook"},
            is_owner=True,
            conversation_id=str(conv.pk),
            turn_id="t1",
            user_text="link facebook",
        )
        assert res["needs_choice"]["slot"] == "auto_redirect_seconds"
        conv.refresh_from_db()
        draft_slug = conv.pending_action["args"]["slug"]
        assert draft_slug.lower() != "facebook"
        slug_row = next(row for row in res["draft"]["fields"] if row["label"] == "Slug")
        assert slug_row["value"] == draft_slug
        assert all("`facebook`" not in note.lower() for note in res["draft"]["notes"])

    def test_update_short_link_can_set_inactive_status(self, link_user: Any) -> None:
        grant(link_user, ShortLinkPermission.UPDATE)
        actor = type(link_user).objects.get(pk=link_user.pk)
        link = ShortLink.objects.create(
            owner=actor, name="fb", slug="fb-off", destination_url="https://a.example/"
        )
        tools = AssistantToolsService()
        for status in ("INACTIVE", "DISABLED"):
            link.status = ShortLink.Status.ACTIVE
            link.save(update_fields=["status"])
            res = tools.execute_tool(
                actor, "update_short_link", {"short_link_id": str(link.pk), "status": status}, is_owner=True
            )
            assert res["ok"] is True
            link.refresh_from_db()
            assert link.status == ShortLink.Status.INACTIVE
