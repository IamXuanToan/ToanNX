"""Luật nháp chung dựng từ metadata model: mọi tool tạo mới tự hỏi các tùy chọn người dùng chưa nêu."""

from datetime import date, timedelta
from decimal import Decimal
from typing import Any
from unittest.mock import patch

import pytest
from django.utils import timezone

from app.system.models.currency import Currency
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.asset import Asset
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.reminder import Reminder
from app.workspace.models.subscription import Subscription
from app.workspace.permissions.asset_permission import AssetPermission
from app.workspace.permissions.assistant_permission import AssistantPermission
from app.workspace.permissions.reminder_permission import ReminderPermission
from app.workspace.permissions.subscription_permission import SubscriptionPermission
from app.workspace.services.assistant_draft_service import AssistantDraftService
from app.workspace.services.assistant_service import AssistantService

pytestmark = pytest.mark.django_db
WEB = AssistantConversation.Channel.WEB


def _tool_call(name: str, arguments: str) -> dict[str, Any]:
    return {
        "ok": True,
        "model": "free-model",
        "tokens": 20,
        "fallback_attempts": 0,
        "message": {
            "role": "assistant",
            "content": "",
            "tool_calls": [
                {"id": "c1", "type": "function", "function": {"name": name, "arguments": arguments}}
            ],
        },
    }


def _text(text: str) -> dict[str, Any]:
    return {
        "ok": True,
        "model": "free-model",
        "tokens": 5,
        "fallback_attempts": 0,
        "message": {"content": text},
    }


def _run(
    user: Any, messages: list[str], llm_responses: list[dict[str, Any]]
) -> tuple[list[dict[str, Any]], int]:
    svc = AssistantService()
    with (
        patch.object(svc.xkiro_client, "is_configured", return_value=True),
        patch.object(svc.xkiro_client, "chat_completion", side_effect=llm_responses) as llm,
    ):
        results = [svc.chat(user, text, channel=WEB) for text in messages]
        return results, llm.call_count


def _captions(result: dict[str, Any]) -> list[str]:
    return [item["caption"] for item in result["message"].metadata.get("quick_replies", [])]


class TestReminderDraft:
    @pytest.fixture
    def actor(self, user: Any) -> Any:
        grant(
            user,
            AssistantPermission.CHAT,
            ReminderPermission.CREATE,
            ReminderPermission.READ,
            ReminderPermission.UPDATE,
        )
        return type(user).objects.get(pk=user.pk)

    def test_vague_request_asks_title_date_time_before_options(self, actor: Any) -> None:
        tomorrow = (timezone.localdate() + timedelta(days=1)).isoformat()
        results, llm_calls = _run(
            actor,
            ["Tôi muốn tạo 1 nhắc lịch", "Họp team dự án", "Ngày mai", "14:30", "15 phút", "Không lặp"],
            [_tool_call("create_quick_reminder", '{"title": "Nhắc lịch"}')],
        )
        ask_title, ask_date, ask_time, ask_before, ask_repeat, done = results

        assert llm_calls == 1
        # Tiêu đề chung chung model tự đặt ("Nhắc lịch") không được coi là người dùng đã nêu.
        assert "**Bạn muốn nhắc việc gì?**" in ask_title["reply"]
        assert "Nhắc lịch" not in ask_title["reply"].split("**Bạn muốn")[0]
        assert ask_title["message"].metadata["quick_input"]["kind"] == "text"
        assert _captions(ask_date) == ["Hôm nay", "Ngày mai", "Ngày kia", "Tuần sau"]
        assert "**Nhắc lúc mấy giờ?**" in ask_time["reply"]
        assert _captions(ask_time)[0] == "Cả ngày (không giờ)"
        assert ask_time["message"].metadata["quick_input"]["placeholder"] == "VD 14:30 hoặc 2h chiều"
        # Đã có giờ → hỏi nhắc trước theo phút (không hỏi theo ngày).
        assert "**Nhắc trước?**" in ask_before["reply"]
        assert _captions(ask_repeat) == [label for _, label in Reminder.Recurrence.choices]

        reminder = Reminder.objects.get(owner=actor, title="Họp team dự án")
        assert reminder.due_date.isoformat() == tomorrow
        assert reminder.due_time is not None and reminder.due_time.strftime("%H:%M") == "14:30"
        assert reminder.notify_minutes_before == 15
        assert reminder.recurrence == Reminder.Recurrence.NONE
        # Link xem lại nằm ở thẻ (nút Web / dòng Telegram), không lặp trong nội dung.
        assert "/vi/ca-nhan/" not in done["reply"]
        assert done["message"].metadata["cards"][0]["view_url"].endswith(f"/nhac-viec/{reminder.pk}")
        card = done["message"].metadata["cards"][0]
        assert card["type"] == "reminder"
        assert card["view_url"].endswith(f"/vi/ca-nhan/nhac-viec/{reminder.pk}")

    def test_reminder_today_at_11h_only_asks_what_and_options(self, actor: Any) -> None:
        results, _ = _run(
            actor,
            ["Tạo tôi 1 nhắc lịch ngày hôm nay lúc 11h", "Gọi điện cho khách", "1", "1"],
            [_tool_call("create_quick_reminder", '{"title": "Nhắc lịch", "due_time": "11:00"}')],
        )
        assert "**Bạn muốn nhắc việc gì?**" in results[0]["reply"]
        # Ngày/giờ đã nói trong câu → không hỏi lại; câu kế là nhắc trước.
        assert "**Nhắc trước?**" in results[1]["reply"]
        reminder = Reminder.objects.get(owner=actor, title="Gọi điện cho khách")
        assert reminder.due_date == timezone.localdate()
        assert reminder.due_time is not None and reminder.due_time.hour == 11
        assert reminder.notify_minutes_before == 0
        assert reminder.recurrence == Reminder.Recurrence.NONE

    def test_options_stated_upfront_create_directly(self, actor: Any) -> None:
        results, _ = _run(
            actor,
            ["Nhắc tôi họp team lúc 11h, nhắc trước 1 tiếng, lặp hàng tuần"],
            [
                _tool_call(
                    "create_quick_reminder",
                    '{"title": "Họp team", "due_time": "11:00", '
                    '"notify_minutes_before": 5, "recurrence": "NONE"}',
                ),
                _text("Đã tạo nhắc việc Họp team."),
            ],
        )
        reminder = Reminder.objects.get(owner=actor, title="Họp team")
        # Lựa chọn người dùng nói ra đè lên giá trị model tự điền sai.
        assert reminder.notify_minutes_before == 60
        assert reminder.recurrence == Reminder.Recurrence.WEEKLY
        assert reminder.due_date == timezone.localdate()
        assert results[0]["message"].metadata.get("quick_replies") in (None, [])
        assert "/vi/ca-nhan/" not in results[0]["reply"]
        assert results[0]["message"].metadata["cards"][0]["view_url"].endswith(f"/nhac-viec/{reminder.pk}")

    def test_all_day_reminder_asks_days_before_instead_of_minutes(self, actor: Any) -> None:
        results, _ = _run(
            actor,
            [
                "Nhắc tôi đóng tiền điện ngày 2026-12-05",
                "Cả ngày (không giờ)",
                "Trước 3, 1 ngày",
                "Hàng tháng",
            ],
            [_tool_call("create_quick_reminder", '{"title": "Đóng tiền điện", "due_date": "2026-12-05"}')],
        )
        assert "**Nhắc lúc mấy giờ?**" in results[0]["reply"]
        assert "Số ngày nhắc trước" in results[1]["reply"]
        reminder = Reminder.objects.get(owner=actor, title="Đóng tiền điện")
        assert reminder.due_date.isoformat() == "2026-12-05"
        assert reminder.due_time is None
        assert reminder.reminder_days_before == [3, 1]
        assert reminder.recurrence == Reminder.Recurrence.MONTHLY

    def test_rename_just_created_reminder_uses_remembered_id(self, actor: Any) -> None:
        svc = AssistantService()
        captured: list[Any] = []
        responses = iter(
            [
                _tool_call(
                    "create_quick_reminder",
                    '{"title": "Họp team", "due_time": "11:00", '
                    '"notify_minutes_before": 0, "recurrence": "NONE"}',
                ),
                _text("Đã tạo."),
            ]
        )

        def first_turn(messages: Any, **kwargs: Any) -> dict[str, Any]:
            return next(responses)

        with (
            patch.object(svc.xkiro_client, "is_configured", return_value=True),
            patch.object(svc.xkiro_client, "chat_completion", side_effect=first_turn),
        ):
            svc.chat(actor, "Nhắc tôi họp team lúc 11h hôm nay, đúng giờ, không lặp", channel=WEB)
        reminder = Reminder.objects.get(owner=actor, title="Họp team")

        def rename_turn(messages: Any, **kwargs: Any) -> dict[str, Any]:
            captured.append(messages[0]["content"])
            if len(captured) == 1:
                return _tool_call(
                    "update_reminder", f'{{"reminder_id": "{reminder.pk}", "title": "Họp sprint review"}}'
                )
            return _text("Đã đổi tên.")

        with (
            patch.object(svc.xkiro_client, "is_configured", return_value=True),
            patch.object(svc.xkiro_client, "chat_completion", side_effect=rename_turn),
        ):
            res = svc.chat(actor, "đổi tên cái vừa tạo thành Họp sprint review", channel=WEB)

        # Prompt lượt sau nhắc lại bản ghi vừa tạo kèm đúng ID và tool sửa.
        assert "BẢN GHI VỪA THAO TÁC" in captured[0]
        assert f'update_reminder(reminder_id="{reminder.pk}")' in captured[0]
        reminder.refresh_from_db()
        assert reminder.title == "Họp sprint review"
        assert Reminder.objects.filter(owner=actor).count() == 1
        # Link xem lại chỉ nằm ở thẻ (nút "Xem chi tiết" trên Web), không lặp trong nội dung tin nhắn.
        assert res["reply"] == "Đã đổi tên."
        cards = res["message"].metadata["cards"]
        assert len(cards) == 1
        assert cards[0]["view_url"].endswith(f"/vi/ca-nhan/nhac-viec/{reminder.pk}")


class TestOtherCreateTools:
    def test_subscription_asks_cycle_reminders_and_auto_renew_from_model(
        self, user: Any, vnd: Currency
    ) -> None:
        grant(user, AssistantPermission.CHAT, SubscriptionPermission.CREATE, SubscriptionPermission.READ)
        actor = type(user).objects.get(pk=user.pk)
        results, llm_calls = _run(
            actor,
            ["Thêm dịch vụ Netflix 200k", "Hàng tháng", "2", "Có"],
            [_tool_call("create_subscription", '{"name": "Netflix", "amount": "200k"}')],
        )
        assert llm_calls == 1
        assert _captions(results[0]) == [label for _, label in Subscription.BillingCycle.choices]
        assert "Tự động trừ tiền" in results[2]["reply"]
        sub = Subscription.objects.get(owner=actor, name="Netflix")
        assert sub.billing_cycle == Subscription.BillingCycle.MONTHLY
        assert sub.reminder_days_before == [1]
        assert sub.auto_renew is True
        assert sub.amount == Decimal("200000")

    def test_custom_cycle_asks_number_of_days_only_when_needed(self, user: Any, vnd: Currency) -> None:
        grant(user, AssistantPermission.CHAT, SubscriptionPermission.CREATE, SubscriptionPermission.READ)
        actor = type(user).objects.get(pk=user.pk)
        results, _ = _run(
            actor,
            ["Thêm dịch vụ VPS 100k", "Tùy chỉnh theo ngày", "45 ngày", "Không nhắc trước", "Không"],
            [_tool_call("create_subscription", '{"name": "VPS", "amount": "100k"}')],
        )
        assert "Số ngày chu kỳ tùy chỉnh" in results[1]["reply"]
        sub = Subscription.objects.get(owner=actor, name="VPS")
        assert sub.billing_cycle == Subscription.BillingCycle.CUSTOM_DAYS
        assert sub.custom_cycle_days == 45
        assert sub.auto_renew is False

    def test_asset_asks_warranty_months_and_accepts_typed_number(self, user: Any, vnd: Currency) -> None:
        grant(user, AssistantPermission.CHAT, AssetPermission.CREATE, AssetPermission.READ)
        actor = type(user).objects.get(pk=user.pk)
        results, _ = _run(
            actor,
            ["Thêm laptop Dell XPS", "18 tháng"],
            [_tool_call("create_asset", '{"name": "Dell XPS"}')],
        )
        assert "Số tháng bảo hành" in results[0]["reply"]
        assert Asset.objects.get(owner=actor, name="Dell XPS").warranty_months == 18


class TestAssetAndClaimDraft:
    def test_asset_without_type_asks_category_from_model_choices(self, user: Any, vnd: Currency) -> None:
        grant(user, AssistantPermission.CHAT, AssetPermission.CREATE, AssetPermission.READ)
        actor = type(user).objects.get(pk=user.pk)
        results, llm_calls = _run(
            actor,
            ["Thêm thiết bị Dell XPS 13", "1", "12 tháng"],
            [_tool_call("create_asset", '{"name": "Dell XPS 13"}')],
        )
        assert llm_calls == 1
        assert _captions(results[0]) == [label for _, label in Asset.Category.choices]
        asset = Asset.objects.get(owner=actor, name="Dell XPS 13")
        assert asset.category == Asset.Category.LAPTOP
        assert asset.warranty_months == 12

    def test_iphone_is_recognized_as_phone_without_asking(self, user: Any, vnd: Currency) -> None:
        grant(user, AssistantPermission.CHAT, AssetPermission.CREATE, AssetPermission.READ)
        actor = type(user).objects.get(pk=user.pk)
        results, _ = _run(
            actor,
            ["Thêm iPhone 15 bảo hành 12 tháng"],
            [_tool_call("create_asset", '{"name": "iPhone 15"}'), _text("Đã thêm.")],
        )
        asset = Asset.objects.get(owner=actor, name="iPhone 15")
        assert asset.category == Asset.Category.PHONE
        assert asset.warranty_months == 12
        assert not results[0]["message"].metadata.get("quick_replies")

    def test_warranty_claim_asks_claim_type_when_unclear(self, user: Any, vnd: Currency) -> None:
        from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim
        from app.workspace.permissions.asset_warranty_claim_permission import AssetWarrantyClaimPermission

        grant(
            user,
            AssistantPermission.CHAT,
            AssetPermission.READ,
            AssetWarrantyClaimPermission.CREATE,
            AssetWarrantyClaimPermission.READ,
        )
        actor = type(user).objects.get(pk=user.pk)
        Asset.objects.create(owner=actor, name="Laptop Dell", purchase_date=date.today(), currency=vnd)
        results, _ = _run(
            actor,
            ["Mang laptop Dell đi tiệm vì màn hình nhấp nháy", "Sửa chữa tính phí"],
            [
                _tool_call(
                    "create_warranty_claim",
                    '{"asset_name": "Laptop Dell", "issue_description": "Màn hình nhấp nháy"}',
                )
            ],
        )
        assert _captions(results[0]) == [label for _, label in AssetWarrantyClaim.ClaimType.choices]
        claim = AssetWarrantyClaim.objects.get(owner=actor)
        assert claim.claim_type == AssetWarrantyClaim.ClaimType.PAID_REPAIR


class TestTextDetection:
    def test_hour_of_appointment_is_not_mistaken_for_notify_before(self) -> None:
        draft = AssistantDraftService()
        spec = draft.spec_for("create_quick_reminder")
        assert spec is not None
        chosen = draft.detect_from_text(spec, "họp lúc 11h nhắc trước 10p", {"due_time": "11:00"})
        assert chosen["notify_minutes_before"] == 10
        chosen = draft.detect_from_text(spec, "họp lúc 11h nhé, nhắc trước giúp tôi", {"due_time": "11:00"})
        assert "notify_minutes_before" not in chosen
        chosen = draft.detect_from_text(spec, "báo đúng giờ, không lặp lại", {"due_time": "11:00"})
        assert chosen == {"notify_minutes_before": 0, "recurrence": "NONE"}
