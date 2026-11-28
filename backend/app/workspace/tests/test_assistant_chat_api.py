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
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.reminder import Reminder
from app.workspace.permissions.assistant_permission import AssistantPermission as P
from app.workspace.permissions.reminder_permission import ReminderPermission
from app.workspace.services.assistant_config_service import AssistantConfigService
from app.workspace.services.assistant_tools_service import AssistantToolsService

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/assistant/chat"


class TestAssistantChatApi(BaseApiTestCase):
    """Kiểm thử Slash, xKiro Fallback + cooldown, `owner_ids`, limit <= 15 & Vault guardrail."""

    def test_slash_commands_zero_tokens_and_remind_shortcut(self, user: Any, login: Any, client: Any) -> None:
        self.assert_unauthorized(client.post(URL, {"message": "/help"}, format="json"))
        self.assert_forbidden(login(user).post(URL, {"message": "/help"}, format="json"), "PERMISSION_DENIED")

        grant(user, P.CHAT, ReminderPermission.READ, ReminderPermission.CREATE)
        api = login(user)

        help_res = self.assert_success(api.post(URL, {"message": "/help"}, format="json"))
        assert help_res["model_used"] == "slash"
        assert help_res["tokens_used"] == 0
        assert "/today" in help_res["reply"]

        vi_help_res = self.assert_success(api.post(URL, {"message": "/tro_giup"}, format="json"))
        assert vi_help_res["model_used"] == "slash"
        assert "/hom_nay" in vi_help_res["reply"]
        assert "/nhac_viec" in vi_help_res["reply"]

        rem_res = self.assert_success(
            api.post(URL, {"message": "/nhac_viec 28/12 09:00 Gia hạn chứng chỉ"}, format="json")
        )
        assert Reminder.objects.filter(owner=user, title="Gia hạn chứng chỉ").exists() is True
        assert rem_res["contains_private_data"] is True

        # Luồng chat Web là 1 luồng duy nhất — mọi lượt chat đều dùng chung conversation_id.
        second_res = self.assert_success(api.post(URL, {"message": "/hom_nay"}, format="json"))
        assert second_res["conversation_id"] == rem_res["conversation_id"]
        assert (
            "Gia hạn chứng chỉ" in second_res["reply"]
            or "Nhắc việc hôm nay" in second_res["reply"]
            or "không có nhắc việc" in second_res["reply"]
        )
        assert (
            AssistantConversation.objects.filter(
                owner=user, channel=AssistantConversation.Channel.WEB
            ).count()
            == 1
        )

        # Lệnh /xoa_lich_su (/clear) dọn toàn bộ tin nhắn cũ trong luồng với 0 token.
        clear_res = self.assert_success(api.post(URL, {"message": "/xoa_lich_su"}, format="json"))
        assert clear_res["model_used"] == "slash"
        assert clear_res["tokens_used"] == 0
        assert clear_res["conversation_id"] == rem_res["conversation_id"]
        assert "xóa lịch sử" in clear_res["reply"].lower()
        assert AssistantConversation.objects.get(pk=clear_res["conversation_id"]).messages.count() == 1

    def test_xkiro_multi_model_fallback_cooldown_and_401_stop(
        self, user: Any, login: Any, settings: Any, fake_redis: Any
    ) -> None:
        settings.XKIRO_API_BASE = "https://xkiro.example.com/v1"
        settings.XKIRO_API_KEY = "test-secret"
        settings.XKIRO_MODEL = "model-a"
        settings.XKIRO_FALLBACK_MODELS = ["model-b", "model-c"]
        settings.XKIRO_TIMEOUT_SECONDS = 5.0
        settings.XKIRO_COOLDOWN_SECONDS = 120

        grant(user, P.CHAT, ReminderPermission.READ, ReminderPermission.CREATE)
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

        # Kiểm tra không có tool quản trị Admin; tool nhạy cảm (Két sắt/Hồ sơ) bị ẩn khi is_owner=False
        owner_schemas = {s["function"]["name"] for s in AssistantToolsService().tool_schemas(is_owner=True)}
        guest_schemas = {s["function"]["name"] for s in AssistantToolsService().tool_schemas(is_owner=False)}
        assert not any(
            kw in name.lower() for name in owner_schemas for kw in ("admin", "setting", "role", "webhook")
        )
        assert "reveal_vault_secret" in owner_schemas
        assert "reveal_vault_secret" not in guest_schemas
        assert "get_my_profile" not in guest_schemas

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
        AssistantConfigService().update_config(user, {"ai_daily_token_limit": 100})
        grant(user, P.CHAT, ReminderPermission.READ, ReminderPermission.CREATE)
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

    def test_custom_assistant_policy_injected_after_core_guardrail(
        self, user: Any, login: Any, settings: Any
    ) -> None:
        settings.XKIRO_API_BASE = "https://xkiro.example.com/v1"
        settings.XKIRO_API_KEY = "test-secret"
        settings.XKIRO_MODEL = "model-a"
        AssistantConfigService().update_config(
            user,
            {"assistant_system_prompt": "Xưng hô bằng Anh/Em và trả lời tối đa 3 gạch đầu dòng."},
        )
        grant(user, P.CHAT, ReminderPermission.READ, ReminderPermission.CREATE)

        captured_system: list[str] = []

        def fake_post(url: str, *, json: Any, headers: Any, timeout: float) -> MagicMock:
            captured_system.append(json["messages"][0]["content"])
            resp = MagicMock()
            resp.status_code = 200
            resp.json.return_value = {
                "model": "model-a",
                "choices": [{"message": {"content": "Chào anh, em đã sẵn sàng."}}],
                "usage": {"total_tokens": 12},
            }
            return resp

        with patch("requests.Session.post", side_effect=fake_post):
            res = self.assert_success(login(user).post(URL, {"message": "Chào em"}, format="json"))

        assert res["reply"] == "Chào anh, em đã sẵn sàng."
        assert len(captured_system) == 1
        sys_prompt = captured_system[0]
        assert "Két sắt" in sys_prompt
        assert "khủng bố" in sys_prompt.lower()
        assert "quân sự" in sys_prompt.lower()
        assert "phân biệt vùng miền" in sys_prompt.lower()
        assert "Xưng hô bằng Anh/Em và trả lời tối đa 3 gạch đầu dòng." in sys_prompt
        assert sys_prompt.index("Két sắt") < sys_prompt.index("Xưng hô bằng Anh/Em")
        assert "múi giờ" in sys_prompt.lower()

    def test_tool_calls_hidden_from_thread_upcoming_events_and_no_leaked_json_synthesis(
        self, superuser: Any, login: Any, settings: Any, vnd: Any
    ) -> None:
        settings.XKIRO_API_BASE = "https://xkiro.example.com/v1"
        settings.XKIRO_API_KEY = "test-secret"
        settings.XKIRO_MODEL = "model-a"
        api = login(superuser)

        other = UserFactory()
        soon = timezone.localdate() + timezone.timedelta(days=2)
        Reminder.objects.create(owner=superuser, title="Họp triển khai", due_date=soon)
        Reminder.objects.create(owner=other, title="Việc bí mật người khác", due_date=soon)

        # Kiểm tra tool mới `get_upcoming_events` lọc theo owner & ẩn tiền khi hide_amounts=True
        events_out = AssistantToolsService().execute_tool(
            superuser,
            "get_upcoming_events",
            {"days_ahead": 7},
            hide_amounts=True,
        )
        assert events_out["ok"] is True
        titles = [item["title"] for item in events_out["items"]]
        assert "Họp triển khai" in titles
        assert "Việc bí mật người khác" not in titles

        # Giả lập LLM tạo nhắc việc xong trả multi-part hoặc raw JSON → tự tổng hợp, không lộ JSON!
        step = {"idx": 0}

        def fake_post(url: str, *, json: Any, headers: Any, timeout: float) -> MagicMock:
            resp = MagicMock()
            resp.status_code = 200
            if step["idx"] == 0:
                step["idx"] += 1
                tool_args = (
                    f'{{"title": "Công việc test", "due_date": "{soon.isoformat()}", '
                    '"due_time": "12h", "priority": "trung bình"}'
                )
                resp.json.return_value = {
                    "model": "model-a",
                    "choices": [
                        {
                            "message": {
                                "content": "",
                                "tool_calls": [
                                    {
                                        "id": "call_create_1",
                                        "function": {
                                            "name": "create_quick_reminder",
                                            "arguments": tool_args,
                                        },
                                    }
                                ],
                            }
                        }
                    ],
                    "usage": {"total_tokens": 30},
                }
                return resp

            # Kiểm tra LLM lỡ trả raw JSON `{"ok": true, ...}` -> backend tự tổng hợp xác nhận đẹp
            resp.json.return_value = {
                "model": "model-a",
                "choices": [
                    {"message": {"content": [{"type": "text", "text": '{"ok": true, "created": {}}'}]}}
                ],
                "usage": {"total_tokens": 10},
            }
            return resp

        with patch("requests.Session.post", side_effect=fake_post):
            chat_res = self.assert_success(
                api.post(
                    URL,
                    {"message": "Công việc test, 12h ưu tiên trung bình, nhắc trước 15 phút, không lặp"},
                    format="json",
                )
            )

        assert Reminder.objects.filter(owner=superuser, title="Công việc test").exists() is True
        assert '{"ok":' not in chat_res["reply"]
        assert "Đã tạo nhắc việc" in chat_res["reply"]
        assert "Công việc test" in chat_res["reply"]

        # GET /thread chỉ thấy tin USER + ASSISTANT cuối, KHÔNG có stub `""` hay JSON `TOOL`
        thread_data = self.assert_success(api.get("/api/v1/workspace/assistant/thread"))
        assert thread_data["total_messages"] == 2
        assert [m["role"] for m in thread_data["messages"]] == ["USER", "ASSISTANT"]

        # Lượt kế tiếp: context LLM KHÔNG chứa assistant content="" hay role=tool mồ côi
        captured_messages: list[list[dict[str, Any]]] = []

        def fake_next_turn(url: str, *, json: Any, headers: Any, timeout: float) -> MagicMock:
            captured_messages.append(json["messages"])
            resp = MagicMock()
            resp.status_code = 200
            resp.json.return_value = {
                "model": "model-a",
                "choices": [{"message": {"content": "Tôi vẫn nhớ ngữ cảnh vừa rồi."}}],
                "usage": {"total_tokens": 10},
            }
            return resp

        with patch("requests.Session.post", side_effect=fake_next_turn):
            self.assert_success(api.post(URL, {"message": "Nhắc lại vừa tạo gì"}, format="json"))

        sent_roles = [(m["role"], m["content"]) for m in captured_messages[0]]
        assert all(role in ("system", "user", "assistant") for role, _ in sent_roles)
        assert all(bool(str(content or "").strip()) for _, content in sent_roles)

    def test_finance_income_creation_clarification_5day_cashflow_and_2step_delete(
        self, user: Any, login: Any, settings: Any, vnd: Any
    ) -> None:
        """Kiểm tra 'tiền afff 30k', dòng tiền 5 ngày, phân quyền & xác nhận 2 bước khi xóa."""
        from app.finance.models.income import Income
        from app.finance.models.platform import Platform
        from app.finance.permissions.income_permission import IncomePermission
        from app.workspace.permissions.reminder_permission import ReminderPermission

        settings.XKIRO_API_BASE = "https://xkiro.example.com/v1"
        settings.XKIRO_API_KEY = "test-secret"
        settings.XKIRO_MODEL = "model-a"
        grant(user, P.CHAT, IncomePermission.CREATE, IncomePermission.READ, ReminderPermission.READ)
        api = login(user)

        # 1. Chưa có nền tảng khớp 'afff' -> trả needs_clarification để hỏi lại
        clarify = AssistantToolsService().execute_tool(
            user,
            "create_finance_income",
            {"amount": "30k", "platform_name": "afff"},
        )
        assert clarify["ok"] is False
        assert clarify["needs_clarification"] is True

        # 2. Có nền tảng Affiliate -> 'tiền afff 30k' khớp tiền tố 'aff' và tạo 30.000đ
        Platform.objects.create(
            owner=user,
            name="Affiliate",
            code="AFFILIATE",
            default_currency=vnd,
            is_active=True,
        )
        created_inc = AssistantToolsService().execute_tool(
            user,
            "create_finance_income",
            {"amount": "30k", "platform_name": "afff", "content": "tiền afff 30k"},
        )
        assert created_inc["ok"] is True
        assert created_inc["created"]["amount_vnd"] == 30000
        assert created_inc["created"]["platform"] == "Affiliate"
        assert Income.objects.filter(owner=user, amount=30000).count() == 1

        # 3. Hỏi dòng tiền nhập vào trong 5 ngày
        cashflow = AssistantToolsService().execute_tool(
            user,
            "get_finance_income_summary",
            {"days": 5},
        )
        assert cashflow["ok"] is True
        assert cashflow["days"] == 5
        assert cashflow["total_vnd"] == 30000
        assert cashflow["count"] == 1
        assert len(cashflow["items"]) == 1

        # 4. Xóa nhắc việc: thiếu quyền -> bị chặn
        rem = Reminder.objects.create(
            owner=user,
            title="Việc hôm nay không cần nữa",
            due_date=timezone.localdate(),
        )
        denied = AssistantToolsService().execute_tool(
            user,
            "delete_personal_record",
            {"resource_type": "reminder", "record_id": str(rem.pk), "confirmed": True},
        )
        assert denied["ok"] is False
        assert ReminderPermission.DELETE.code in denied["error"]

        # 5. Có quyền xóa -> Lượt 1 AI cố truyền confirmed=True vẫn bị chặn ở backend và yêu cầu hỏi lại!
        grant(user, ReminderPermission.DELETE)
        turn_step = {"idx": 0}

        def fake_delete_turn_1(url: str, *, json: Any, headers: Any, timeout: float) -> MagicMock:
            resp = MagicMock()
            resp.status_code = 200
            if turn_step["idx"] == 0:
                turn_step["idx"] += 1
                resp.json.return_value = {
                    "model": "model-a",
                    "choices": [
                        {
                            "message": {
                                "content": "",
                                "tool_calls": [
                                    {
                                        "id": "call_del_1",
                                        "function": {
                                            "name": "delete_personal_record",
                                            "arguments": (
                                                f'{{"resource_type": "reminder", '
                                                f'"record_id": "{rem.pk}", "confirmed": true}}'
                                            ),
                                        },
                                    }
                                ],
                            }
                        }
                    ],
                    "usage": {"total_tokens": 20},
                }
                return resp
            resp.json.return_value = {
                "model": "model-a",
                "choices": [
                    {"message": {"content": "Bạn có chắc muốn xóa **Việc hôm nay không cần nữa** không?"}}
                ],
                "usage": {"total_tokens": 15},
            }
            return resp

        with patch("requests.Session.post", side_effect=fake_delete_turn_1):
            r1 = self.assert_success(
                api.post(URL, {"message": "Việc hôm nay không cần nữa xóa đi"}, format="json")
            )
        assert "xóa" in r1["reply"].lower()
        assert Reminder.objects.filter(pk=rem.pk, deleted_at__isnull=True).exists() is True

        # 6. Lượt 2: Người dùng xác nhận đồng ý -> xóa mềm thành công!
        turn_step["idx"] = 0

        def fake_delete_turn_2(url: str, *, json: Any, headers: Any, timeout: float) -> MagicMock:
            resp = MagicMock()
            resp.status_code = 200
            if turn_step["idx"] == 0:
                turn_step["idx"] += 1
                resp.json.return_value = {
                    "model": "model-a",
                    "choices": [
                        {
                            "message": {
                                "content": "",
                                "tool_calls": [
                                    {
                                        "id": "call_del_2",
                                        "function": {
                                            "name": "delete_personal_record",
                                            "arguments": (
                                                f'{{"resource_type": "reminder", '
                                                f'"record_id": "{rem.pk}", "confirmed": true}}'
                                            ),
                                        },
                                    }
                                ],
                            }
                        }
                    ],
                    "usage": {"total_tokens": 20},
                }
                return resp
            resp.json.return_value = {
                "model": "model-a",
                "choices": [{"message": {"content": "Đã xóa nhắc việc theo xác nhận của bạn."}}],
                "usage": {"total_tokens": 12},
            }
            return resp

        with patch("requests.Session.post", side_effect=fake_delete_turn_2):
            self.assert_success(api.post(URL, {"message": "Đồng ý xóa"}, format="json"))
        assert Reminder.objects.filter(pk=rem.pk, deleted_at__isnull=True).exists() is False
