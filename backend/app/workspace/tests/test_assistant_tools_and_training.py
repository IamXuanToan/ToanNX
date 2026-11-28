"""Kiểm thử Agentic Tools mở rộng, xác nhận 2 bước khi xóa, RBAC & Telegram Group 2 chế độ."""

from datetime import timedelta
from decimal import Decimal
from typing import Any
from unittest.mock import patch

import pytest
from django.utils import timezone

from app.finance.models.income import Income
from app.finance.models.platform import Platform
from app.finance.permissions.income_permission import IncomePermission
from app.system.models.currency import Currency
from app.system.models.telegram_chat import TelegramChat
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.reminder import Reminder
from app.workspace.permissions.assistant_permission import AssistantPermission
from app.workspace.permissions.reminder_permission import ReminderPermission
from app.workspace.services.assistant_config_service import AssistantConfigService
from app.workspace.services.assistant_service import AssistantService
from app.workspace.services.assistant_tools_service import AssistantToolsService
from app.workspace.services.telegram_assistant_router_service import TelegramAssistantRouterService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService

pytestmark = pytest.mark.django_db


class TestAssistantToolsAndTraining:
    """Kiểm tra các kịch bản thực tế: tiền afff 30k, dòng tiền 5 ngày, xóa có xác nhận & Telegram 2 chế độ."""

    def test_create_finance_income_short_money_and_clarification(self, user: Any, vnd: Currency) -> None:
        grant(user, AssistantPermission.CHAT, IncomePermission.CREATE)
        Platform.objects.create(
            owner=user,
            name="Affiliate",
            code="AFFILIATE",
            default_currency=vnd,
            is_active=True,
        )
        tools = AssistantToolsService()

        # Trường hợp 1: "tiền afff 30k" khớp gần đúng nền tảng Affiliate -> tạo Income 30,000đ
        res = tools.execute_tool(
            user,
            "create_finance_income",
            {"amount": "30k", "platform_name": "afff", "content": "tiền afff 30k"},
            is_owner=True,
        )
        assert res["ok"] is True
        assert res["created"]["amount_vnd"] == 30000
        assert res["created"]["platform"] == "Affiliate"
        assert Income.objects.filter(owner=user, amount=Decimal("30000")).count() == 1

        # Trường hợp 2: Nền tảng không tồn tại -> yêu cầu hỏi lại người dùng
        clarify = tools.execute_tool(
            user,
            "create_finance_income",
            {"amount": "50k", "platform_name": "xyz_unknown"},
            is_owner=True,
        )
        assert clarify["ok"] is False
        assert clarify["needs_clarification"] is True
        assert any(p["name"] == "Affiliate" for p in clarify["available_platforms"])

    def test_finance_income_summary_last_5_days(self, user: Any, vnd: Currency) -> None:
        grant(user, AssistantPermission.CHAT, IncomePermission.READ)
        plat = Platform.objects.create(
            owner=user, name="YouTube", code="YOUTUBE", default_currency=vnd, is_active=True
        )
        today_local = WorkspaceTimezoneService().local_today("Asia/Ho_Chi_Minh")
        now = timezone.now()
        Income.objects.create(
            owner=user,
            platform=plat,
            currency=vnd,
            original_amount=Decimal("100000"),
            amount=Decimal("100000"),
            received_at=now,
            received_date=today_local,
            content="Trong 5 ngày",
        )
        Income.objects.create(
            owner=user,
            platform=plat,
            currency=vnd,
            original_amount=Decimal("500000"),
            amount=Decimal("500000"),
            received_at=now - timedelta(days=10),
            received_date=today_local - timedelta(days=10),
            content="Ngoài 5 ngày",
        )

        res = AssistantToolsService().execute_tool(
            user,
            "get_finance_income_summary",
            {"days": 5},
            is_owner=True,
        )
        assert res["ok"] is True
        assert res["days"] == 5
        assert res["total_vnd"] == 100000
        assert res["count"] == 1
        assert len(res["items"]) == 1

    def test_delete_requires_two_step_confirmation_and_permission(self, user: Any) -> None:
        grant(user, AssistantPermission.CHAT)
        rem = Reminder.objects.create(
            owner=user,
            title="Việc hôm nay cần xóa",
            due_date=WorkspaceTimezoneService().local_today("Asia/Ho_Chi_Minh"),
        )
        tools = AssistantToolsService()
        # Trạng thái chờ xác nhận lưu trên hội thoại thật trong DB (không phụ thuộc cache từng process).
        conv = AssistantConversation.objects.create(owner=user, channel=AssistantConversation.Channel.WEB)

        # Thiếu quyền DELETE -> bị chặn ngay ở RBAC
        denied = tools.execute_tool(
            user,
            "delete_personal_record",
            {"resource_type": "reminder", "record_id": str(rem.pk)},
            is_owner=True,
            conversation_id=str(conv.pk),
            turn_id="turn-1",
        )
        assert denied["ok"] is False
        assert "reminder.delete" in denied["error"]

        # Cấp quyền DELETE (nạp lại user để làm mới cache quyền): lượt 1 hỏi xác nhận, không xóa ngay
        grant(user, ReminderPermission.DELETE)
        user = type(user).objects.get(pk=user.pk)
        step1 = tools.execute_tool(
            user,
            "delete_personal_record",
            {"resource_type": "reminder", "record_id": str(rem.pk)},
            is_owner=True,
            conversation_id=str(conv.pk),
            turn_id="turn-1",
        )
        assert step1["ok"] is False
        assert step1["requires_confirmation"] is True
        assert Reminder.objects.filter(pk=rem.pk).exists()

        # AI tự confirm trong cùng lượt turn-1 -> vẫn bị chặn!
        same_turn = tools.execute_tool(
            user,
            "delete_personal_record",
            {"resource_type": "reminder", "record_id": str(rem.pk), "confirmed": True},
            is_owner=True,
            conversation_id=str(conv.pk),
            turn_id="turn-1",
        )
        assert same_turn["ok"] is False
        assert same_turn["requires_confirmation"] is True
        assert Reminder.objects.filter(pk=rem.pk).exists()

        # Lượt 2 (turn-2) sau khi người dùng xác nhận -> xóa thành công!
        step2 = tools.execute_tool(
            user,
            "delete_personal_record",
            {"resource_type": "reminder", "record_id": str(rem.pk), "confirmed": True},
            is_owner=True,
            conversation_id=str(conv.pk),
            turn_id="turn-2",
        )
        assert step2["ok"] is True
        assert not Reminder.objects.filter(pk=rem.pk, deleted_at__isnull=True).exists()

    def test_assistant_service_stops_tool_loop_on_confirmation_request(self, user: Any) -> None:
        grant(user, AssistantPermission.CHAT, ReminderPermission.DELETE)
        rem = Reminder.objects.create(
            owner=user,
            title="Họp 10h",
            due_date=WorkspaceTimezoneService().local_today("Asia/Ho_Chi_Minh"),
        )
        svc = AssistantService()
        call_responses = [
            {
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
                            "function": {
                                "name": "delete_personal_record",
                                "arguments": f'{{"resource_type":"reminder","record_id":"{rem.pk}"}}',
                            },
                        }
                    ],
                },
            },
            {
                "ok": True,
                "model": "free-model",
                "tokens": 15,
                "fallback_attempts": 0,
                "message": {
                    "role": "assistant",
                    "content": "Bạn có chắc muốn xóa nhắc việc **Họp 10h** không?",
                },
            },
        ]
        with (
            patch.object(svc.xkiro_client, "is_configured", return_value=True),
            patch.object(svc.xkiro_client, "chat_completion", side_effect=call_responses),
        ):
            res = svc.chat(user, "Xóa việc Họp 10h", channel=AssistantConversation.Channel.WEB)

        assert "Họp 10h" in res["reply"]
        assert Reminder.objects.filter(pk=rem.pk).exists()

    def test_telegram_group_reply_modes_mention_only_vs_all_messages(self, user: Any, settings: Any) -> None:
        settings.TELEGRAM_BOT_TOKEN = "123:TG-BOT"  # noqa: S105 - giá trị test
        settings.TELEGRAM_BOT_USERNAME = "ToanNXBot"
        grant(user, AssistantPermission.CHAT)
        AssistantConfigService().update_config(
            user, {"telegram_ai_enabled": True, "telegram_group_require_mention": True}
        )
        TelegramChat.objects.create(
            owner=user,
            chat_id="555001",
            chat_type="private",
            title="DM",
            status=TelegramChat.Status.ACTIVE,
            is_active=True,
        )
        group = TelegramChat.objects.create(
            owner=user,
            chat_id="-100888",
            chat_type="group",
            title="Nhóm 2 người",
            status=TelegramChat.Status.ACTIVE,
            is_active=True,
            group_reply_mode=TelegramChat.GroupReplyMode.MENTION_ONLY,
        )

        router = TelegramAssistantRouterService()
        update_plain = {
            "update_id": 1001,
            "message": {
                "message_id": 10,
                "chat": {"id": -100888, "type": "group"},
                "from": {"id": 555001, "username": "toannx", "is_bot": False},
                "text": "tiền afff 30k",
            },
        }
        with patch.object(router.qstash_client, "is_configured", return_value=False):
            # Chế độ 1 (mention_only): bỏ qua tin nhắn thường không tag @bot
            r1 = router.handle_webhook_update(update_plain)
            assert r1 == {"handled": False, "reason": "mention_required"}

            # Chuyển sang chế độ 2 (all_messages): đọc và trả lời mọi tin nhắn
            group.group_reply_mode = TelegramChat.GroupReplyMode.ALL_MESSAGES
            group.save(update_fields=["group_reply_mode"])
            with (
                patch.object(
                    router.assistant_service,
                    "chat",
                    return_value={
                        "reply": "Đã ghi nhận 30.000đ",
                        "model_used": "free",
                        "contains_private_data": True,
                    },
                ) as mock_chat,
                patch.object(router.reply_service, "send_reply") as mock_send,
            ):
                r2 = router.handle_webhook_update(update_plain)
                assert r2["handled"] is True
                mock_chat.assert_called_once()
                mock_send.assert_called_once()

            # Tin nhắn từ bot khác luôn bị bỏ qua dù ở chế độ all_messages
            bot_update = {
                "update_id": 1002,
                "message": {
                    "message_id": 11,
                    "chat": {"id": -100888, "type": "group"},
                    "from": {"id": 999999, "username": "other_bot", "is_bot": True},
                    "text": "hello",
                },
            }
            assert router.handle_webhook_update(bot_update) == {
                "handled": False,
                "reason": "ignore_bot_sender",
            }

    def test_client_capabilities_profile_statistics_vault_and_rename(self, user: Any, vnd: Currency) -> None:
        """Kiểm tra liệt kê module, xem/đổi tên hồ sơ, thống kê, giải mã Két sắt & đổi tên Thiết bị."""
        from app.workspace.models.asset import Asset
        from app.workspace.models.vault_item import VaultItem
        from app.workspace.permissions.asset_permission import AssetPermission
        from app.workspace.permissions.vault_item_permission import VaultItemPermission

        grant(
            user,
            AssistantPermission.CHAT,
            AssetPermission.READ,
            AssetPermission.UPDATE,
            VaultItemPermission.READ,
            VaultItemPermission.CREATE,
            VaultItemPermission.UPDATE,
            VaultItemPermission.REVEAL,
        )
        tools = AssistantToolsService()

        # 1. Liệt kê module cá nhân (chỉ hiển thị module có quyền, không có Admin)
        caps = tools.execute_tool(user, "get_my_capabilities", {}, is_owner=True)
        assert caps["ok"] is True
        assert caps["scope"] == "CLIENT_PORTAL_ONLY"
        mod_names = [m["module"] for m in caps["modules"]]
        assert "Két sắt bí mật" in mod_names
        assert "Thiết bị & Bảo hành" in mod_names

        # 2. Xem và đổi tên hồ sơ cá nhân thành ABC
        prof = tools.execute_tool(user, "get_my_profile", {}, is_owner=True)
        assert prof["ok"] is True
        assert prof["profile"]["username"] == user.username

        renamed_prof = tools.execute_tool(user, "update_my_profile", {"full_name": "ABC"}, is_owner=True)
        assert renamed_prof["ok"] is True
        assert renamed_prof["updated"]["full_name"] == "ABC"

        # 3. Két sắt: tạo -> tìm -> giải mã đọc mã số -> đổi tên thành ABC
        created_vault = tools.execute_tool(
            user,
            "create_vault_item",
            {"title": "PIN Thẻ", "secret": "998877", "username": "toannx"},
            is_owner=True,
        )
        assert created_vault["ok"] is True
        vault_id = created_vault["created"]["id"]

        listed_vault = tools.execute_tool(user, "list_vault_items", {"query": "PIN"}, is_owner=True)
        assert listed_vault["total_count"] == 1
        assert "998877" not in str(listed_vault)

        revealed = tools.execute_tool(user, "reveal_vault_secret", {"vault_item_id": vault_id}, is_owner=True)
        assert revealed["ok"] is True
        assert revealed["item"]["secret"] == "998877"

        renamed_vault = tools.execute_tool(
            user, "update_vault_item", {"vault_item_id": vault_id, "title": "ABC"}, is_owner=True
        )
        assert renamed_vault["ok"] is True
        assert renamed_vault["updated"]["title"] == "ABC"
        assert VaultItem.objects.get(pk=vault_id).title == "ABC"

        # 4. Thiết bị: đổi tên thành ABC & Thống kê cá nhân
        asset = Asset.objects.create(
            owner=user,
            name="Laptop cũ",
            purchase_date=WorkspaceTimezoneService().local_today("Asia/Ho_Chi_Minh"),
            purchase_price=Decimal("10000000"),
            purchase_price_vnd=Decimal("10000000"),
            currency=vnd,
        )
        renamed_asset = tools.execute_tool(
            user, "update_asset", {"asset_id": str(asset.pk), "name": "ABC"}, is_owner=True
        )
        assert renamed_asset["ok"] is True
        assert renamed_asset["updated"]["name"] == "ABC"

        stats = tools.execute_tool(user, "get_personal_statistics", {}, is_owner=True)
        assert stats["ok"] is True
        assert stats["assets"]["total"] == 1
        assert stats["vault_items"]["total"] == 1

    def test_strict_rbac_isolation_hides_unpermitted_module_tools_and_blocks_calls(self, user: Any) -> None:
        """Tài khoản không có quyền module Tài chính không thấy schema và không truy cập được."""
        grant(user, AssistantPermission.CHAT, ReminderPermission.READ)
        tools = AssistantToolsService()

        schemas = tools.tool_schemas(is_owner=True, actor=user)
        names = {s["function"]["name"] for s in schemas}

        # Có quyền nhắc việc -> có get_pending_reminders
        assert "get_pending_reminders" in names
        # Không có quyền Tài chính, Két sắt, Thiết bị, Xóa -> bị ẩn hoàn toàn khỏi schema
        assert "get_finance_income_summary" not in names
        assert "create_finance_income" not in names
        assert "list_finance_platforms" not in names
        assert "list_vault_items" not in names
        assert "reveal_vault_secret" not in names
        assert "delete_personal_record" not in names

        # Gọi trực tiếp tool Tài chính -> bị chặn bởi RBAC
        denied = tools.execute_tool(user, "get_finance_income_summary", {"days": 5}, is_owner=True)
        assert denied["ok"] is False
        assert IncomePermission.READ.code in denied["error"]

        # Liệt kê module và thống kê không chứa Tài chính
        caps = tools.execute_tool(user, "get_my_capabilities", {}, is_owner=True)
        assert not any("Tài chính" in m["module"] for m in caps["modules"])
        stats = tools.execute_tool(user, "get_personal_statistics", {}, is_owner=True)
        assert "income" not in stats

    def test_create_reminder_with_notify_minutes_before_and_recurrence(self, user: Any) -> None:
        """Kiểm tra tạo nhắc việc hỗ trợ `notify_minutes_before` (báo trước 1 phút) & `recurrence`."""
        grant(user, AssistantPermission.CHAT, ReminderPermission.CREATE, ReminderPermission.READ)
        tools = AssistantToolsService()

        res = tools.execute_tool(
            user,
            "create_quick_reminder",
            {
                "title": "Báo cáo công việc",
                "due_time": "08:40",
                "notify_minutes_before": 1,
                "recurrence": "WEEKLY",
                "topic_name": "Công việc",
            },
            is_owner=True,
        )
        assert res["ok"] is True
        assert res["created"]["title"] == "Báo cáo công việc"
        assert res["created"]["due_time"] == "08:40"
        assert res["created"]["notify_minutes_before"] == 1
        assert res["created"]["recurrence"] == "WEEKLY"
        rem = Reminder.objects.get(pk=res["created"]["id"])
        assert rem.notify_minutes_before == 1
        assert rem.recurrence == Reminder.Recurrence.WEEKLY

    def test_create_short_link_with_options_and_real_url(self, user: Any, settings: Any) -> None:
        """Kiểm tra tạo link rút gọn trả `short_url` thật, hỗ trợ chờ bấm nút/đếm giây & mật khẩu."""
        from app.utilities.permissions.short_link_permission import ShortLinkPermission

        settings.FRONTEND_URL = "https://toannx.com"
        grant(user, AssistantPermission.CHAT, ShortLinkPermission.CREATE, ShortLinkPermission.READ)
        tools = AssistantToolsService()

        # Trường hợp 1: chờ người xem bấm nút (auto_redirect_seconds=None) + có mật khẩu bảo vệ
        res = tools.execute_tool(
            user,
            "create_short_link",
            {
                "destination_url": "https://www.facebook.com/",
                "slug": "fb-me",
                "name": "Facebook",
                "auto_redirect_seconds": None,
                "password": "secret-123",  # noqa: S106 - mật khẩu test
            },
            is_owner=True,
        )
        assert res["ok"] is True
        assert res["created"]["short_url"] == "https://toannx.com/s/fb-me"
        assert res["created"]["auto_redirect_seconds"] is None
        assert res["created"]["has_password"] is True
