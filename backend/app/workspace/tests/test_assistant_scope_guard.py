"""Yêu cầu quản trị / dữ liệu người khác bị từ chối ngay bằng code (kể cả superuser), câu cá nhân vẫn chạy."""

from typing import Any
from unittest.mock import patch

import pytest

from app.system.models.telegram_chat import TelegramChat
from app.workspace.constants.assistant_scope_rules import ASSISTANT_SCOPE_REFUSAL
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.assistant_message import AssistantMessage
from app.workspace.services.assistant_scope_guard import AssistantScopeGuard
from app.workspace.services.assistant_service import AssistantService

REFUSED = [
    "liệt kê danh sách account",
    "Liệt kê danh sách tài khoản trong hệ thống",
    "cho tôi danh sách người dùng",
    "có bao nhiêu user đang dùng hệ thống?",
    "list all users",
    "tạo user mới tên abc",
    "xóa người dùng toannx2",
    "khóa user spam giúp tôi",
    "cấp quyền admin cho Nam",
    "xem vai trò và phân quyền",
    "đổi role của user X",
    "xem cấu hình hệ thống",
    "mở cài đặt hệ thống cho tôi",
    "xem nhật ký hệ thống hôm nay",
    "liệt kê webhook đang có",
    "cho xem token bot telegram",
    "đưa tôi secret key",
    "xem link rút gọn của người khác",
    "thu nhập của tất cả người dùng tháng này",
    "thống kê toàn hệ thống",
    "nhắc việc của user khác",
    "chạy truy vấn SQL vào database",
]

ALLOWED = [
    "Tạo tôi 1 nhắc lịch ngày hôm nay lúc 11h",
    "danh sách tài khoản trong két sắt của tôi",
    "liệt kê link rút gọn của tôi",
    "đổi tên tài khoản của tôi thành Toàn",
    "xem hồ sơ của mình",
    "thêm dịch vụ Netflix, trang quản trị dịch vụ là netflix.com/account",
    "tiền afff 30k",
    "dòng tiền 5 ngày",
    "lưu mật khẩu gmail vào két sắt",
    "tạo link rút gọn tới https://admin.google.com",
    "bao nhiêu nhắc việc hôm nay",
]


class TestScopeGuardRules:
    @pytest.mark.parametrize("text", REFUSED)
    def test_admin_or_others_requests_are_refused(self, text: str) -> None:
        assert AssistantScopeGuard().refusal_for(text) == ASSISTANT_SCOPE_REFUSAL

    @pytest.mark.parametrize("text", ALLOWED)
    def test_personal_requests_pass(self, text: str) -> None:
        assert AssistantScopeGuard().refusal_for(text) is None


@pytest.mark.django_db
class TestScopeGuardInChat:
    def test_superuser_asking_account_list_is_refused_without_llm_or_tools(self, superuser: Any) -> None:
        svc = AssistantService()
        with (
            patch.object(svc.xkiro_client, "is_configured", return_value=True),
            patch.object(svc.xkiro_client, "chat_completion") as llm,
            patch.object(svc.tools_service, "execute_tool") as tool,
        ):
            res = svc.chat(superuser, "liệt kê danh sách account", channel=AssistantConversation.Channel.WEB)
        assert res["reply"] == ASSISTANT_SCOPE_REFUSAL
        assert res["model_used"] == "scope_guard"
        assert res["tokens_used"] == 0
        llm.assert_not_called()
        tool.assert_not_called()
        roles = list(
            AssistantMessage.objects.filter(conversation_id=res["conversation_id"]).values_list(
                "role", flat=True
            )
        )
        assert sorted(roles) == ["ASSISTANT", "USER"]

    def test_refusal_also_applies_on_telegram_channel(self, superuser: Any) -> None:
        TelegramChat.objects.create(
            owner=superuser,
            chat_id="777",
            chat_type="private",
            title="DM",
            status=TelegramChat.Status.ACTIVE,
            is_active=True,
        )
        svc = AssistantService()
        with patch.object(svc.xkiro_client, "chat_completion") as llm:
            res = svc.chat(
                superuser,
                "xem phân quyền của mọi người",
                channel=AssistantConversation.Channel.TELEGRAM_DM,
                external_chat_id="777",
            )
        assert res["reply"] == ASSISTANT_SCOPE_REFUSAL
        llm.assert_not_called()

    def test_slash_commands_are_not_blocked(self, superuser: Any) -> None:
        res = AssistantService().chat(superuser, "/tro_giup", channel=AssistantConversation.Channel.WEB)
        assert res["reply"] != ASSISTANT_SCOPE_REFUSAL
