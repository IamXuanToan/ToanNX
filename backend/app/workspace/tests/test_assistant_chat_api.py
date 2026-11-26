"""Kiểm thử Trợ lý AI Chat: POST /api/v1/workspace/assistant/chat."""

import json
from decimal import Decimal
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
import requests
from django.utils import timezone

from app.core.cache.cache_service import CacheService
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.finance.models.income import Income
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.reminder import Reminder
from app.workspace.models.workspace_setting import WorkspaceSetting
from app.workspace.permissions.assistant_permission import AssistantPermission as P
from app.workspace.services.assistant_tools_service import AssistantToolsService

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/assistant/chat"


class TestAssistantChatApi(BaseApiTestCase):
    """Kiểm thử Slash, xKiro Fallback + cooldown, `owner_ids`, limit <= 15 & Vault guardrail."""

    def test_slash_commands_zero_tokens_and_remind_shortcut(self, user: Any, login: Any, client: Any) -> None:
        self.assert_unauthorized(client.post(URL, {"message": "/help"}, format="json"))
        self.assert_forbidden(login(user).post(URL, {"message": "/help"}, format="json"), "PERMISSION_DENIED")

        grant(user, P.CHAT)
        api = login(user)

        help_res = self.assert_success(api.post(URL, {"message": "/help"}, format="json"))
        assert help_res["model_used"] == "slash"
        assert help_res["tokens_used"] == 0
        assert "/today" in help_res["reply"]

        rem_res = self.assert_success(
            api.post(URL, {"message": "/remind 28/12 09:00 Gia hạn chứng chỉ"}, format="json")
        )
        assert Reminder.objects.filter(owner=user, title="Gia hạn chứng chỉ").exists() is True
        assert rem_res["contains_private_data"] is True

        new_res = self.assert_success(
            api.post(
                URL,
                {"message": "/newchat", "conversation_id": rem_res["conversation_id"]},
                format="json",
            )
        )
        assert new_res["conversation_id"] != rem_res["conversation_id"]

    def test_xkiro_multi_model_fallback_cooldown_and_401_stop(
        self, user: Any, login: Any, settings: Any, fake_redis: Any
    ) -> None:
        settings.XKIRO_API_BASE = "https://xkiro.example.com/v1"
        settings.XKIRO_API_KEY = "test-secret"
        settings.XKIRO_MODEL = "model-a"
        settings.XKIRO_FALLBACK_MODELS = ["model-b", "model-c"]
        settings.XKIRO_TIMEOUT_SECONDS = 5.0
        settings.XKIRO_COOLDOWN_SECONDS = 120

        grant(user, P.CHAT)
        api = login(user)

        called_models: list[str] = []

        def fake_post(url: str, *, json: Any, headers: Any, timeout: float) -> MagicMock:
            assert timeout <= 5.0
            model = json["model"]
            called_models.append(model)
            resp = MagicMock()
            if model == "model-a":
                resp.status_code = 429
                return resp
            if model == "model-b":
                raise requests.Timeout("timeout")
            resp.status_code = 200
            resp.json.return_value = {
                "model": "model-c",
                "choices": [{"message": {"content": "Trả lời từ model dự phòng C!"}}],
                "usage": {"total_tokens": 42},
            }
            return resp

        with patch("requests.Session.post", side_effect=fake_post):
            res = self.assert_success(api.post(URL, {"message": "Xin chào!"}, format="json"))
        assert called_models == ["model-a", "model-b", "model-c"]
        assert res["model_used"] == "model-c"
        assert res["fallback_attempts"] == 2
        assert res["is_fallback"] is False
        assert CacheService().get_json("workspace:ai:model_cooldown:model-a") is not None
        assert CacheService().get_json("workspace:ai:model_cooldown:model-b") is not None

        # Lỗi 401 sai API key: dừng ngay, KHÔNG fallback sang model-b/c!
        called_401: list[str] = []

        def fake_401(url: str, *, json: Any, headers: Any, timeout: float) -> MagicMock:
            called_401.append(json["model"])
            resp = MagicMock()
            resp.status_code = 401
            return resp

        with patch("requests.Session.post", side_effect=fake_401):
            auth_err = self.assert_success(api.post(URL, {"message": "Thử 401"}, format="json"))
        assert len(called_401) == 1
        assert auth_err["is_fallback"] is True

    def test_tool_owner_isolation_even_for_superuser_limit_15_and_no_vault_tool(
        self, superuser: Any, login: Any, settings: Any, vnd: Any
    ) -> None:
        other = UserFactory()
        today = timezone.localdate()
        now = timezone.now()
        Income.objects.create(
            owner=superuser,
            source=Income.Source.MANUAL,
            received_at=now,
            received_date=today,
            currency=vnd,
            original_amount=Decimal("100000"),
            amount=Decimal("100000"),
            amount_status=Income.AmountStatus.OK,
        )
        Income.objects.create(
            owner=other,
            source=Income.Source.MANUAL,
            received_at=now,
            received_date=today,
            currency=vnd,
            original_amount=Decimal("900000"),
            amount=Decimal("900000"),
            amount_status=Income.AmountStatus.OK,
        )
        for idx in range(20):
            Reminder.objects.create(owner=superuser, title=f"Việc {idx}", due_date=today)

        # Kiểm tra 0 có bất kỳ tool nào truy cập Két sắt (VaultItem)
        schema_names = {s["function"]["name"] for s in AssistantToolsService().tool_schemas(is_owner=True)}
        assert not any("vault" in name.lower() for name in schema_names)

        # Khi superuser (ADMIN) hỏi thu nhập qua tool → FinanceReportService vẫn chỉ tính 100k của chính mình.
        settings.XKIRO_API_BASE = "https://xkiro.example.com/v1"
        settings.XKIRO_API_KEY = "test-secret"
        settings.XKIRO_MODEL = "gpt-4o-mini"

        tool_results: list[dict[str, Any]] = []
        turn = {"idx": 0}

        def fake_tool_loop(url: str, *, json: Any, headers: Any, timeout: float) -> MagicMock:
            resp = MagicMock()
            resp.status_code = 200
            if turn["idx"] == 0:
                turn["idx"] += 1
                resp.json.return_value = {
                    "model": "gpt-4o-mini",
                    "choices": [
                        {
                            "message": {
                                "content": "",
                                "tool_calls": [
                                    {
                                        "id": "call_1",
                                        "function": {
                                            "name": "get_finance_income_summary",
                                            "arguments": f'{{"month": {today.month}, "year": {today.year}}}',
                                        },
                                    },
                                    {
                                        "id": "call_2",
                                        "function": {
                                            "name": "get_pending_reminders",
                                            "arguments": '{"scope": "today"}',
                                        },
                                    },
                                ],
                            }
                        }
                    ],
                    "usage": {"total_tokens": 20},
                }
                return resp
            for msg in json["messages"]:
                if msg["role"] == "tool":
                    tool_results.append(msg)
            resp.json.return_value = {
                "model": "gpt-4o-mini",
                "choices": [{"message": {"content": "Thu nhập của bạn tháng này là 100.000 đ."}}],
                "usage": {"total_tokens": 15},
            }
            return resp

        with patch("requests.Session.post", side_effect=fake_tool_loop):
            res = self.assert_success(
                login(superuser).post(URL, {"message": "Thu nhập tháng này của tôi?"}, format="json")
            )
        assert res["contains_private_data"] is True
        parsed_income = json.loads(tool_results[0]["content"])
        parsed_rem = json.loads(tool_results[1]["content"])
        assert parsed_income["total_vnd"] == 100000
        assert len(parsed_rem["items"]) == 15
        assert parsed_rem["total_count"] == 20

    def test_daily_token_limit_triggers_slash_fallback(self, user: Any, login: Any) -> None:
        WorkspaceSetting.objects.create(owner=user, ai_daily_token_limit=100)
        grant(user, P.CHAT)
        api = login(user)
        # Seed trực tiếp tin nhắn tiêu 100 token hôm nay qua /help trước hay AssistantMessage
        r0 = self.assert_success(api.post(URL, {"message": "/help"}, format="json"))
        from app.workspace.models.assistant_message import AssistantMessage

        AssistantMessage.objects.create(
            conversation_id=r0["conversation_id"],
            role=AssistantMessage.Role.ASSISTANT,
            content="spent",
            tokens_used=120,
        )
        res = self.assert_success(api.post(URL, {"message": "Hỏi thêm câu nữa"}, format="json"))
        assert res["is_fallback"] is True
        assert res["fallback_code"] == "WORKSPACE_AI_DAILY_LIMIT_EXCEEDED"
