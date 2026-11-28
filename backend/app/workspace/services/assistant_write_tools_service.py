"""Thực thi các thao tác tạo, cập nhật và xóa có xác nhận 2 bước cho Trợ lý AI."""

import re
from datetime import date, time
from decimal import Decimal, InvalidOperation
from typing import Any
from urllib.parse import urlsplit

from django.utils import timezone as dj_timezone

from app.core.constants.defaults import DEFAULT_TIMEZONE
from app.core.context.user_context import get_current_request
from app.core.utils.text import ascii_slug
from app.finance.models.platform import Platform
from app.finance.services.income_service import IncomeService
from app.finance.services.invoice_service import InvoiceService
from app.finance.services.platform_service import PlatformService
from app.system.services.attachment_service import AttachmentService
from app.system.services.currency_service import CurrencyService
from app.system.services.current_user_service import CurrentUserService
from app.system.utils.frontend_url import get_frontend_origin
from app.utilities.models.page import Page
from app.utilities.models.qr_code import QrCode
from app.utilities.models.short_link import ShortLink
from app.utilities.permissions.page_path_permission import PagePathPermission
from app.utilities.services.page_path_service import PagePathService
from app.utilities.services.page_service import PageService
from app.utilities.services.qr_code_service import QrCodeService
from app.utilities.services.short_link_service import ShortLinkService
from app.utilities.utils.qr_content import validate_qr_content
from app.workspace.constants.workspace_defaults import ASSISTANT_SLUG_SUGGESTION_LIMIT
from app.workspace.models.asset import Asset
from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim
from app.workspace.models.reminder import Reminder
from app.workspace.models.subscription import Subscription
from app.workspace.services.asset_service import AssetService
from app.workspace.services.asset_warranty_claim_service import AssetWarrantyClaimService
from app.workspace.services.assistant_confirmation_service import AssistantConfirmationService
from app.workspace.services.reminder_service import ReminderService
from app.workspace.services.reminder_topic_service import ReminderTopicService
from app.workspace.services.subscription_payment_service import SubscriptionPaymentService
from app.workspace.services.subscription_service import SubscriptionService
from app.workspace.services.vault_item_service import VaultItemService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService


class AssistantWriteToolsService:
    """Xử lý các tool ghi/sửa/xóa an toàn trên dữ liệu của chính chủ (`owner_id=actor.pk`)."""

    def __init__(
        self,
        reminder_service: ReminderService | None = None,
        income_service: IncomeService | None = None,
        platform_service: PlatformService | None = None,
        currency_service: CurrencyService | None = None,
        asset_service: AssetService | None = None,
        claim_service: AssetWarrantyClaimService | None = None,
        subscription_service: SubscriptionService | None = None,
        short_link_service: ShortLinkService | None = None,
        qr_code_service: QrCodeService | None = None,
        page_service: PageService | None = None,
        page_path_service: PagePathService | None = None,
        vault_item_service: VaultItemService | None = None,
        current_user_service: CurrentUserService | None = None,
        tz_service: WorkspaceTimezoneService | None = None,
        confirmation_service: AssistantConfirmationService | None = None,
        invoice_service: InvoiceService | None = None,
        attachment_service: AttachmentService | None = None,
        subscription_payment_service: SubscriptionPaymentService | None = None,
        reminder_topic_service: ReminderTopicService | None = None,
    ) -> None:
        """Khởi tạo các service nghiệp vụ và bộ xác nhận xóa 2 bước."""
        self.reminder_service = reminder_service or ReminderService()
        self.reminder_topic_service = reminder_topic_service or ReminderTopicService()
        self.income_service = income_service or IncomeService()
        self.platform_service = platform_service or PlatformService()
        self.currency_service = currency_service or CurrencyService()
        self.asset_service = asset_service or AssetService()
        self.claim_service = claim_service or AssetWarrantyClaimService()
        self.subscription_service = subscription_service or SubscriptionService()
        self.short_link_service = short_link_service or ShortLinkService()
        self.qr_code_service = qr_code_service or QrCodeService()
        self.page_service = page_service or PageService()
        self.page_path_service = page_path_service or PagePathService()
        self.vault_item_service = vault_item_service or VaultItemService()
        self.current_user_service = current_user_service or CurrentUserService()
        self.tz_service = tz_service or WorkspaceTimezoneService()
        self.confirmation_service = confirmation_service or AssistantConfirmationService()
        self.invoice_service = invoice_service or InvoiceService()
        self.attachment_service = attachment_service or AttachmentService()
        self.subscription_payment_service = subscription_payment_service or SubscriptionPaymentService()

    # ------------------------------------------------------------------ Hồ sơ & Két sắt
    def update_my_profile(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Cập nhật tên hiển thị hồ sơ cá nhân của chính `actor`."""
        full_name = str(args.get("full_name") or "").strip()
        if not full_name:
            return {"ok": False, "error": "Họ tên mới không được để trống."}
        old_name = getattr(actor, "full_name", "") or getattr(actor, "username", "")
        profile = self.current_user_service.update_profile(actor, {"full_name": full_name[:150]})
        return {
            "ok": True,
            "updated": {
                "id": str(profile.user.pk),
                "old_full_name": old_name,
                "full_name": profile.user.full_name,
                "username": profile.user.username,
            },
        }

    def create_vault_item(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Thêm mục bí mật mới vào Két sắt cá nhân của chính `actor`."""
        title = str(args.get("title") or "").strip()
        secret = str(args.get("secret") or "")
        if not title or not secret:
            return {"ok": False, "error": "Tiêu đề và mã bí mật không được để trống."}
        created = self.vault_item_service.create(
            actor,
            {
                "title": title[:200],
                "secret": secret,
                "username": str(args.get("username") or "").strip()[:150],
                "category": str(args.get("category") or "").strip()[:80],
                "url": str(args.get("url") or "").strip()[:500],
                "notes": str(args.get("notes") or "").strip()[:1000],
            },
        )
        return {
            "ok": True,
            "created": {
                "id": str(created.pk),
                "title": created.title,
                "username": created.username,
                "secret_last4": created.secret_last4,
            },
        }

    def update_vault_item(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Cập nhật mục Két sắt cá nhân của chính `actor`."""
        item_id = str(args.get("vault_item_id") or "").strip()
        if not item_id:
            return {"ok": False, "error": "Thiếu `vault_item_id` cần cập nhật."}
        item = self.vault_item_service.get_for_write(actor, item_id)
        if item.owner_id != actor.pk:
            return {"ok": False, "error": "Chỉ được sửa mục Két sắt của chính bạn."}
        old_title = item.title
        payload: dict[str, Any] = {}
        for field_name, max_len in (
            ("title", 200),
            ("username", 150),
            ("category", 80),
            ("url", 500),
            ("notes", 1000),
        ):
            if args.get(field_name) is not None:
                payload[field_name] = str(args[field_name]).strip()[:max_len]
        if args.get("secret"):
            payload["secret"] = str(args["secret"])
        if not payload:
            return {"ok": False, "error": "Chưa có trường nào cần cập nhật."}
        updated = self.vault_item_service.update(actor, item.pk, payload)
        return {
            "ok": True,
            "updated": {
                "id": str(updated.pk),
                "old_title": old_title,
                "title": updated.title,
                "secret_last4": updated.secret_last4,
            },
        }

    # ------------------------------------------------------------------ Nhắc việc
    def create_quick_reminder(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Tạo nhắc việc cá nhân mới cho chính chủ."""
        title = str(args.get("title") or "").strip()
        if not title:
            return {"ok": False, "error": "Tiêu đề nhắc việc không được trống."}
        due_date_val = (
            self.parse_date(str(args.get("due_date") or ""))
            if args.get("due_date")
            else self.tz_service.local_today(DEFAULT_TIMEZONE)
        )
        due_time_val: time | None = None
        if args.get("due_time"):
            parsed = self._parse_time(str(args["due_time"]))
            if parsed is None:
                return {"ok": False, "error": "Giờ đến hạn phải đúng dạng HH:MM."}
            due_time_val = parsed
        priority = self._normalize_priority(args.get("priority"))
        payload: dict[str, Any] = {
            "title": title[:255],
            "due_date": due_date_val,
            "due_time": due_time_val,
            "priority": priority,
        }
        if args.get("notify_minutes_before") is not None:
            payload["notify_minutes_before"] = max(0, min(int(args["notify_minutes_before"]), 1440))
        if isinstance(args.get("reminder_days_before"), list):
            payload["reminder_days_before"] = [
                max(0, min(int(d), 365)) for d in args["reminder_days_before"][:10]
            ]
        if args.get("recurrence"):
            rec = str(args["recurrence"]).strip().upper()
            if rec in {c[0] for c in Reminder.Recurrence.choices}:
                payload["recurrence"] = rec
        if args.get("description") or args.get("notes"):
            payload["description"] = str(args.get("description") or args.get("notes")).strip()[:1000]
        raw_topic = args.get("topic_name") or args.get("topic")
        if isinstance(raw_topic, str) and raw_topic.strip():
            matched_topic = self.reminder_topic_service.resolve_for_actor(actor, raw_topic.strip())
            if matched_topic is not None:
                payload["topic_id"] = str(matched_topic.pk)
        created = self.reminder_service.create(actor, payload)
        return {
            "ok": True,
            "created": {
                "id": str(created.pk),
                "title": created.title,
                "due_date": created.due_date.isoformat(),
                "due_time": created.due_time.strftime("%H:%M") if created.due_time else "",
                "notify_minutes_before": created.notify_minutes_before,
                "reminder_days_before": created.reminder_days_before,
                "recurrence": created.recurrence,
                "priority": created.priority,
                "topic": created.topic.name if created.topic else "",
            },
        }

    def update_reminder(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Cập nhật hoặc đánh dấu hoàn thành nhắc việc của chính chủ."""
        reminder_id = str(args.get("reminder_id") or "").strip()
        if not reminder_id:
            return {"ok": False, "error": "Thiếu `reminder_id` cần cập nhật."}
        rem = self.reminder_service.get_for_write(actor, reminder_id)
        if rem.owner_id != actor.pk:
            return {"ok": False, "error": "Chỉ được cập nhật nhắc việc của chính bạn."}
        payload: dict[str, Any] = {}
        if args.get("title"):
            payload["title"] = str(args["title"]).strip()[:255]
        if args.get("due_date"):
            payload["due_date"] = self._parse_date(str(args["due_date"]))
        if "due_time" in args:
            raw_time = str(args.get("due_time") or "").strip()
            if not raw_time:
                payload["due_time"] = None
            else:
                parsed = self._parse_time(raw_time)
                if parsed is None:
                    return {"ok": False, "error": "Giờ đến hạn phải đúng dạng HH:MM."}
                payload["due_time"] = parsed
        if "is_completed" in args and args["is_completed"] is not None:
            payload["is_completed"] = bool(args["is_completed"])
        if args.get("priority"):
            payload["priority"] = self._normalize_priority(args["priority"])
        if args.get("notify_minutes_before") is not None:
            payload["notify_minutes_before"] = max(0, min(int(args["notify_minutes_before"]), 1440))
        if isinstance(args.get("reminder_days_before"), list):
            payload["reminder_days_before"] = [
                max(0, min(int(d), 365)) for d in args["reminder_days_before"][:10]
            ]
        if args.get("recurrence"):
            rec = str(args["recurrence"]).strip().upper()
            if rec in {c[0] for c in Reminder.Recurrence.choices}:
                payload["recurrence"] = rec
        if args.get("description") is not None:
            payload["description"] = str(args["description"]).strip()[:1000]
        raw_topic = args.get("topic_name") if "topic_name" in args else args.get("topic")
        if isinstance(raw_topic, str):
            if not raw_topic.strip():
                payload["topic_id"] = None
            else:
                matched_topic = self.reminder_topic_service.resolve_for_actor(actor, raw_topic.strip())
                if matched_topic is not None:
                    payload["topic_id"] = str(matched_topic.pk)
        if not payload:
            return {"ok": False, "error": "Không có trường nào để cập nhật."}
        updated = self.reminder_service.update(actor, rem.pk, payload)
        return {
            "ok": True,
            "updated": {
                "id": str(updated.pk),
                "title": updated.title,
                "due_date": updated.due_date.isoformat(),
                "due_time": updated.due_time.strftime("%H:%M") if updated.due_time else "",
                "notify_minutes_before": updated.notify_minutes_before,
                "recurrence": updated.recurrence,
                "is_completed": updated.is_completed,
                "priority": updated.priority,
                "topic": updated.topic.name if updated.topic else "",
            },
        }

    # ------------------------------------------------------------------ Tài chính
    def create_finance_income(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Tạo khoản thu nhập mới; nếu tên nền tảng chưa rõ thì trả `needs_clarification=True`."""
        amount = self._parse_amount(args.get("amount"))
        if amount <= 0:
            return {"ok": False, "error": "Số tiền thu nhập phải lớn hơn 0."}

        currency_code = str(args.get("currency_code") or "").strip().upper()
        currency = (
            self.currency_service.get_active_by_code(currency_code)
            if currency_code
            else self.currency_service.base()
        )
        today_local = self.tz_service.local_today(DEFAULT_TIMEZONE)
        day = self._parse_date(str(args["received_date"])) if args.get("received_date") else today_local
        received_at = self.tz_service.local_to_utc(day, time(12, 0), DEFAULT_TIMEZONE)
        if day == today_local:
            received_at = dj_timezone.now()

        platform_id = str(args.get("platform_id") or "").strip() or None
        platform_name = str(args.get("platform_name") or "").strip()
        allow_unclassified = bool(args.get("allow_unclassified", False))
        selected_platform: Platform | None = None

        if platform_id:
            candidate = self.platform_service.get_usable(actor, platform_id)
            if candidate.owner_id != actor.pk:
                return {"ok": False, "error": "Nền tảng không thuộc quyền sở hữu của bạn."}
            selected_platform = candidate
        elif platform_name:
            platforms = list(
                self.platform_service.get_queryset_for(actor)
                .filter(owner_id=actor.pk, is_active=True)
                .order_by("name")
            )
            matched = self._match_platforms(platforms, platform_name)
            if len(matched) == 1:
                selected_platform = matched[0]
            elif len(matched) > 1:
                return {
                    "ok": False,
                    "needs_clarification": True,
                    "reason": "ambiguous_platform",
                    "candidates": [{"id": str(p.pk), "name": p.name, "code": p.code} for p in matched[:10]],
                    "error": (
                        f"Có {len(matched)} nền tảng khớp với '{platform_name}'. "
                        "Hãy hỏi lại người dùng chọn đúng nền tảng."
                    ),
                }
            elif not allow_unclassified:
                return {
                    "ok": False,
                    "needs_clarification": True,
                    "reason": "platform_not_found",
                    "requested_platform": platform_name,
                    "available_platforms": [
                        {"id": str(p.pk), "name": p.name, "code": p.code} for p in platforms[:15]
                    ],
                    "error": (
                        f"Không tìm thấy nền tảng '{platform_name}'. Hãy hỏi lại người dùng muốn chọn "
                        "nền tảng nào trong danh sách, hay tạo nền tảng mới, hay ghi nhận chưa phân loại."
                    ),
                }

        content = str(args.get("content") or "").strip()
        if not content:
            content = (
                selected_platform.name if selected_platform else (platform_name or "Thu nhập qua Trợ lý AI")
            )

        created = self.income_service.create(
            actor,
            {
                "received_at": received_at,
                "currency_id": currency.pk,
                "original_amount": amount,
                "platform_id": selected_platform.pk if selected_platform else None,
                "content": content[:500],
                "note": str(args.get("note") or "").strip()[:500],
            },
        )
        return {
            "ok": True,
            "created": {
                "id": str(created.pk),
                "received_date": created.received_date.isoformat(),
                "platform": created.platform.name if created.platform else "Chưa phân loại",
                "content": created.content,
                "original_amount": int(created.original_amount or 0),
                "currency": currency.code,
                "amount_vnd": int(created.amount or 0),
            },
        }

    def update_finance_income(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Cập nhật khoản thu nhập của chính chủ."""
        income_id = str(args.get("income_id") or "").strip()
        if not income_id:
            return {"ok": False, "error": "Thiếu `income_id` cần cập nhật."}
        income = self.income_service.get_for_write(actor, income_id)
        if income.owner_id != actor.pk:
            return {"ok": False, "error": "Chỉ được sửa khoản thu nhập của chính bạn."}
        payload: dict[str, Any] = {}
        if args.get("amount") is not None:
            amount = self._parse_amount(args["amount"])
            if amount <= 0:
                return {"ok": False, "error": "Số tiền phải lớn hơn 0."}
            payload["original_amount"] = amount
        if args.get("received_date"):
            day = self._parse_date(str(args["received_date"]))
            payload["received_at"] = self.tz_service.local_to_utc(day, time(12, 0), DEFAULT_TIMEZONE)
        if args.get("content") is not None:
            payload["content"] = str(args["content"]).strip()[:500]
        if args.get("platform_name"):
            platforms = list(
                self.platform_service.get_queryset_for(actor).filter(owner_id=actor.pk, is_active=True)
            )
            matched = self._match_platforms(platforms, str(args["platform_name"]))
            if len(matched) != 1:
                return {"ok": False, "error": "Không xác định duy nhất nền tảng cần đổi."}
            payload["platform_id"] = matched[0].pk
        if not payload:
            return {"ok": False, "error": "Không có trường nào để cập nhật."}
        updated = self.income_service.update(actor, income.pk, payload)
        return {
            "ok": True,
            "updated": {
                "id": str(updated.pk),
                "received_date": updated.received_date.isoformat(),
                "platform": updated.platform.name if updated.platform else "Chưa phân loại",
                "content": updated.content,
                "amount_vnd": int(updated.amount or 0),
            },
        }

    def create_finance_platform(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Tạo nền tảng thu nhập mới (VD: Affiliate, TikTok Shop)."""
        name = str(args.get("name") or "").strip()
        if not name:
            return {"ok": False, "error": "Tên nền tảng không được để trống."}
        code = str(args.get("code") or "").strip().upper() or ascii_slug(name).replace("-", "_").upper()[:32]
        if not code:
            code = "CUSTOM_PLATFORM"
        currency_code = str(args.get("currency_code") or "").strip().upper()
        currency = (
            self.currency_service.get_active_by_code(currency_code)
            if currency_code
            else self.currency_service.base()
        )
        created = self.platform_service.create(
            actor,
            {
                "name": name[:120],
                "code": code[:50],
                "default_currency_id": currency.pk,
                "description": str(args.get("description") or "").strip()[:500],
            },
        )
        return {
            "ok": True,
            "created": {
                "id": str(created.pk),
                "name": created.name,
                "code": created.code,
                "default_currency": currency.code,
            },
        }

    # ------------------------------------------------------------------ Thiết bị & Dịch vụ
    def create_asset(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Tạo thiết bị cá nhân mới cho chính chủ."""
        name = str(args.get("name") or "").strip()
        if not name:
            return {"ok": False, "error": "Tên thiết bị không được trống."}
        price = self._parse_amount(args.get("purchase_price") or 0)
        currency_code = str(args.get("currency_code") or "").strip().upper()
        currency = (
            self.currency_service.get_active_by_code(currency_code)
            if currency_code
            else self.currency_service.base()
        )
        purchase_date = (
            self._parse_date(str(args["purchase_date"]))
            if args.get("purchase_date")
            else self.tz_service.local_today(DEFAULT_TIMEZONE)
        )
        warranty_months = int(args["warranty_months"]) if args.get("warranty_months") is not None else 12
        category = str(args.get("category") or Asset.Category.OTHER).strip().upper()
        if category not in Asset.Category.values:
            category = Asset.Category.OTHER
        created = self.asset_service.create(
            actor,
            {
                "name": name[:200],
                "category": category,
                "brand": str(args.get("brand") or "").strip()[:100],
                "model_code": str(args.get("model_code") or "").strip()[:100],
                "serial_number": str(args.get("serial_number") or "").strip()[:120],
                "imei": str(args.get("imei") or "").strip()[:60],
                "purchase_date": purchase_date,
                "purchase_price": price,
                "currency_id": currency.pk,
                "warranty_months": max(0, min(240, warranty_months)),
                "warranty_provider": str(args.get("warranty_provider") or "").strip()[:150],
                "warranty_note": str(args.get("warranty_note") or "").strip()[:500],
                "purchase_store": str(args.get("purchase_store") or "").strip()[:200],
                "notes": str(args.get("notes") or "").strip()[:1000],
            },
        )
        return {
            "ok": True,
            "created": {
                "id": str(created.pk),
                "name": created.name,
                "purchase_date": created.purchase_date.isoformat(),
                "purchase_price_vnd": int(created.purchase_price_vnd or 0),
                "category": created.category,
                "warranty_months": created.warranty_months,
                "warranty_end_date": (
                    created.warranty_end_date.isoformat() if created.warranty_end_date else None
                ),
            },
        }

    def create_warranty_claim(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Tạo phiếu bảo hành / sửa chữa cho thiết bị của chính chủ."""
        asset_id = str(args.get("asset_id") or "").strip()
        asset_name = str(args.get("asset_name") or "").strip()
        if not asset_id and asset_name:
            assets, _ = self.asset_service.search_with_warranty_summary(actor, query=asset_name)
            if len(assets) == 1:
                asset_id = str(assets[0].pk)
            elif len(assets) > 1:
                return {
                    "ok": False,
                    "needs_clarification": True,
                    "candidates": [{"id": str(a.pk), "name": a.name} for a in assets[:10]],
                    "error": "Có nhiều thiết bị khớp, hãy hỏi người dùng chọn thiết bị cụ thể.",
                }
        if not asset_id:
            return {"ok": False, "error": "Không tìm thấy thiết bị để tạo phiếu bảo hành."}
        asset = self.asset_service.get_by_id_for(actor, asset_id)
        if asset.owner_id != actor.pk:
            return {"ok": False, "error": "Thiết bị không thuộc quyền sở hữu của bạn."}
        claim_type = str(args.get("claim_type") or AssetWarrantyClaim.ClaimType.WARRANTY).strip().upper()
        if claim_type not in {c[0] for c in AssetWarrantyClaim.ClaimType.choices}:
            claim_type = AssetWarrantyClaim.ClaimType.WARRANTY
        currency = self.currency_service.base()
        cost = self._parse_amount(args.get("cost") or 0)
        submitted_date = (
            self._parse_date(str(args["submitted_date"]))
            if args.get("submitted_date")
            else self.tz_service.local_today(DEFAULT_TIMEZONE)
        )
        created = self.claim_service.create(
            actor,
            {
                "asset_id": asset.pk,
                "claim_type": claim_type,
                "submitted_date": submitted_date,
                "currency_id": currency.pk,
                "cost": cost,
                "issue_description": str(args.get("issue_description") or "Bảo hành / kiểm tra").strip()[
                    :500
                ],
                "service_center": str(args.get("service_center") or "").strip()[:200],
            },
        )
        return {
            "ok": True,
            "created": {
                "id": str(created.pk),
                "claim_code": created.claim_code,
                "asset": asset.name,
                "claim_type": created.claim_type,
                "submitted_date": created.submitted_date.isoformat(),
                "cost_vnd": int(created.cost_vnd or 0),
            },
        }

    def create_subscription(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Tạo dịch vụ định kỳ mới cho chính chủ."""
        name = str(args.get("name") or "").strip()
        if not name:
            return {"ok": False, "error": "Tên dịch vụ không được trống."}
        amount = self._parse_amount(args.get("amount") or 0)
        if amount <= 0:
            return {"ok": False, "error": "Số tiền dịch vụ phải lớn hơn 0."}
        currency_code = str(args.get("currency_code") or "").strip().upper()
        currency = (
            self.currency_service.get_active_by_code(currency_code)
            if currency_code
            else self.currency_service.base()
        )
        cycle = str(args.get("billing_cycle") or Subscription.BillingCycle.MONTHLY).strip().upper()
        if cycle not in {c[0] for c in Subscription.BillingCycle.choices}:
            cycle = Subscription.BillingCycle.MONTHLY
        renew_date = (
            self._parse_date(str(args["renew_date"]))
            if args.get("renew_date")
            else self.tz_service.local_today(DEFAULT_TIMEZONE)
        )
        sub_payload: dict[str, Any] = {
            "name": name[:200],
            "provider": str(args.get("provider") or "").strip()[:200],
            "category": str(args.get("category") or "").strip()[:80],
            "billing_cycle": cycle,
            "currency_id": currency.pk,
            "amount": amount,
            "renew_date": renew_date,
            "auto_renew": bool(args.get("auto_renew", False)),
            "notes": str(args.get("notes") or "").strip()[:1000],
        }
        if args.get("custom_cycle_days") is not None:
            sub_payload["custom_cycle_days"] = max(1, min(int(args["custom_cycle_days"]), 3650))
        if isinstance(args.get("reminder_days_before"), list):
            sub_payload["reminder_days_before"] = [
                max(0, min(int(d), 365)) for d in args["reminder_days_before"][:10]
            ]
        created = self.subscription_service.create(actor, sub_payload)
        return {
            "ok": True,
            "created": {
                "id": str(created.pk),
                "name": created.name,
                "billing_cycle": created.billing_cycle,
                "renew_date": created.renew_date.isoformat(),
                "amount_vnd": int(created.amount_vnd or 0),
            },
        }

    def renew_subscription(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Ghi nhận gia hạn dịch vụ định kỳ của chính chủ."""
        sub_id = str(args.get("subscription_id") or "").strip()
        if not sub_id:
            return {"ok": False, "error": "Thiếu `subscription_id` cần gia hạn."}
        sub = self.subscription_service.get_for_write(actor, sub_id)
        if sub.owner_id != actor.pk:
            return {"ok": False, "error": "Chỉ được gia hạn dịch vụ của chính bạn."}
        payload: dict[str, Any] = {}
        if args.get("paid_on"):
            payload["paid_on"] = self._parse_date(str(args["paid_on"]))
        if args.get("amount") is not None:
            payload["amount"] = self._parse_amount(args["amount"])
        payment = self.subscription_service.renew(actor, sub.pk, payload)
        return {
            "ok": True,
            "renewed": {
                "payment_id": str(payment.pk),
                "subscription": sub.name,
                "paid_on": payment.paid_on.isoformat(),
                "period_to": payment.period_to.isoformat(),
                "amount_vnd": int(payment.amount_vnd or 0),
            },
        }

    # ------------------------------------------------------------------ Tiện ích
    def draft_preparers(self) -> dict[str, Any]:
        """Bước chuẩn bị nháp riêng của tool (sửa `args`, trả ghi chú hiển thị); tool khác không cần khai."""
        return {"create_short_link": self.prepare_short_link_draft}

    def prepare_short_link_draft(self, args: dict[str, Any]) -> list[str]:
        """Thay slug model đề xuất bằng slug đẹp còn trống và trả ghi chú các slug còn trống khác."""
        suggestions = self._short_link_slug_suggestions(args)
        if suggestions and args.get("slug") != suggestions[0]:
            args["slug"] = suggestions[0]
        others = [item for item in suggestions if item != args.get("slug")]
        return ["Slug còn trống khác: " + ", ".join(f"`{item}`" for item in others) + "."] if others else []

    def create_short_link(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Tạo link rút gọn (kiểu mở và mật khẩu đã được luật nháp chung hỏi đủ trước khi tới đây)."""
        url = str(args.get("destination_url") or "").strip()
        if not url:
            return {"ok": False, "error": "URL đích không được trống."}
        payload: dict[str, Any] = {
            "destination_url": url,
            "name": str(args.get("name") or args.get("title") or "").strip()[:150],
            "description": str(args.get("description") or "").strip()[:1000],
        }
        if args.get("slug"):
            payload["slug"] = str(args["slug"]).strip()[:80]
        if "auto_redirect_seconds" in args:
            payload["auto_redirect_seconds"] = self._clamp_redirect(args["auto_redirect_seconds"])
        if args.get("password"):
            payload["password"] = str(args["password"])
        if args.get("expires_at"):
            payload["expires_at"] = self._parse_expires_at(str(args["expires_at"]))
        created = self.short_link_service.create(actor, payload)
        return {"ok": True, "created": self._short_link_info(created)}

    def _clamp_redirect(self, raw: Any) -> int | None:
        if raw is None or raw == "":
            return None
        # DB chỉ nhận null (chờ bấm) hoặc 1..60 giây; "chuyển ngay" = 1 giây.
        return max(1, min(int(raw), 60))

    def _short_link_slug_suggestions(self, args: dict[str, Any]) -> list[str]:
        """Slug ứng viên đẹp từ slug model đề xuất, tên hiển thị và tên miền đích; chỉ trả slug còn trống."""
        candidates: list[str] = []
        if args.get("slug"):
            candidates.append(ascii_slug(str(args["slug"])))
        host = urlsplit(str(args.get("destination_url") or "")).hostname or ""
        host_parts = [part for part in host.lower().split(".") if part not in ("www", "m", "")]
        brand = host_parts[0] if host_parts else ""
        if args.get("name"):
            candidates.append(ascii_slug(str(args["name"])))
        if brand:
            candidates.extend([brand, f"my-{brand}", f"{brand}-link", f"go-{brand}"])
        return self.short_link_service.suggest_available_slugs(
            [item for item in candidates if item], limit=ASSISTANT_SLUG_SUGGESTION_LIMIT
        )

    def create_qr_code(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Tạo mã QR mới lưu vào thư viện của chính chủ."""
        name = str(args.get("name") or "").strip()
        raw_content = str(args.get("content") or args.get("content_text") or "").strip()
        if not name or not raw_content:
            return {"ok": False, "error": "Tên và nội dung mã QR không được trống."}
        qr_type = str(args.get("qr_type") or "").strip().upper()
        if not qr_type:
            qr_type = QrCode.Type.URL if raw_content.startswith(("http://", "https://")) else QrCode.Type.TEXT
        if qr_type not in {c[0] for c in QrCode.Type.choices}:
            qr_type = QrCode.Type.TEXT
        content_dict: dict[str, Any] = (
            {"url": raw_content} if qr_type == QrCode.Type.URL else {"text": raw_content}
        )
        validated_content, validated_design = validate_qr_content(qr_type, content_dict, {})
        created = self.qr_code_service.create(
            actor,
            {
                "name": name[:120],
                "qr_type": qr_type,
                "content": validated_content,
                "design": validated_design,
            },
        )
        return {
            "ok": True,
            "created": {
                "id": str(created.pk),
                "name": created.name,
                "qr_type": created.qr_type,
            },
        }

    def update_asset(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Cập nhật thiết bị cá nhân của chính `actor`."""
        asset_id = str(args.get("asset_id") or "").strip()
        if not asset_id:
            return {"ok": False, "error": "Thiếu `asset_id` cần cập nhật."}
        asset = self.asset_service.get_for_write(actor, asset_id)
        if asset.owner_id != actor.pk:
            return {"ok": False, "error": "Chỉ được sửa thiết bị của chính bạn."}
        old_name = asset.name
        payload: dict[str, Any] = {}
        if args.get("name"):
            payload["name"] = str(args["name"]).strip()[:200]
        for field_name, max_len in (
            ("brand", 100),
            ("model_code", 100),
            ("serial_number", 120),
            ("purchase_store", 150),
            ("warranty_provider", 150),
            ("warranty_note", 500),
            ("notes", 1000),
        ):
            if args.get(field_name) is not None:
                payload[field_name] = str(args[field_name]).strip()[:max_len]
        if args.get("status"):
            status = str(args["status"]).strip().upper()
            if status in {c[0] for c in Asset.Status.choices}:
                payload["status"] = status
        if args.get("purchase_price") is not None:
            payload["purchase_price"] = self._parse_amount(args["purchase_price"])
        if args.get("warranty_months") is not None:
            payload["warranty_months"] = max(0, min(int(args["warranty_months"]), 240))
        if not payload:
            return {"ok": False, "error": "Chưa có trường nào cần cập nhật."}
        updated = self.asset_service.update(actor, asset.pk, payload)
        return {
            "ok": True,
            "updated": {
                "id": str(updated.pk),
                "old_name": old_name,
                "name": updated.name,
                "status": updated.status,
            },
        }

    def update_warranty_claim(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Cập nhật phiếu bảo hành / sửa chữa của chính `actor`."""
        claim_id = str(args.get("claim_id") or "").strip()
        if not claim_id:
            return {"ok": False, "error": "Thiếu `claim_id` cần cập nhật."}
        claim = self.claim_service.get_for_write(actor, claim_id)
        if claim.owner_id != actor.pk:
            return {"ok": False, "error": "Chỉ được sửa phiếu bảo hành của chính bạn."}
        payload: dict[str, Any] = {}
        if args.get("status"):
            status = str(args["status"]).strip().upper()
            if status in {c[0] for c in AssetWarrantyClaim.Status.choices}:
                payload["status"] = status
        if args.get("issue_description"):
            payload["issue_description"] = str(args["issue_description"]).strip()[:500]
        if args.get("service_center") is not None:
            payload["service_center"] = str(args["service_center"]).strip()[:150]
        if args.get("cost") is not None:
            payload["cost"] = self._parse_amount(args["cost"])
        if not payload:
            return {"ok": False, "error": "Chưa có trường nào cần cập nhật."}
        updated = self.claim_service.update(actor, claim.pk, payload)
        return {
            "ok": True,
            "updated": {"id": str(updated.pk), "claim_code": updated.claim_code, "status": updated.status},
        }

    def update_subscription(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Cập nhật dịch vụ định kỳ của chính `actor`."""
        sub_id = str(args.get("subscription_id") or "").strip()
        if not sub_id:
            return {"ok": False, "error": "Thiếu `subscription_id` cần cập nhật."}
        sub = self.subscription_service.get_for_write(actor, sub_id)
        if sub.owner_id != actor.pk:
            return {"ok": False, "error": "Chỉ được sửa dịch vụ của chính bạn."}
        old_name = sub.name
        payload: dict[str, Any] = {}
        if args.get("name"):
            payload["name"] = str(args["name"]).strip()[:200]
        if args.get("provider") is not None:
            payload["provider"] = str(args["provider"]).strip()[:150]
        if args.get("billing_cycle"):
            cycle = str(args["billing_cycle"]).strip().upper()
            if cycle in {c[0] for c in Subscription.BillingCycle.choices}:
                payload["billing_cycle"] = cycle
        if args.get("amount") is not None:
            payload["amount"] = self._parse_amount(args["amount"])
        if args.get("renew_date"):
            payload["renew_date"] = self._parse_date(str(args["renew_date"]))
        if "auto_renew" in args and args["auto_renew"] is not None:
            payload["auto_renew"] = bool(args["auto_renew"])
        if "is_active" in args and args["is_active"] is not None:
            payload["is_active"] = bool(args["is_active"])
        if args.get("category") is not None:
            payload["category"] = str(args["category"]).strip()[:80]
        if args.get("notes") is not None:
            payload["notes"] = str(args["notes"]).strip()[:1000]
        if isinstance(args.get("reminder_days_before"), list):
            payload["reminder_days_before"] = [
                max(0, min(int(d), 365)) for d in args["reminder_days_before"][:10]
            ]
        if not payload:
            return {"ok": False, "error": "Chưa có trường nào cần cập nhật."}
        updated = self.subscription_service.update(actor, sub.pk, payload)
        return {
            "ok": True,
            "updated": {
                "id": str(updated.pk),
                "old_name": old_name,
                "name": updated.name,
                "renew_date": updated.renew_date.isoformat(),
            },
        }

    def update_short_link(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Cập nhật liên kết rút gọn của chính `actor`."""
        link_id = str(args.get("short_link_id") or "").strip()
        if not link_id:
            return {"ok": False, "error": "Thiếu `short_link_id` cần cập nhật."}
        link = self.short_link_service.get_for_write(actor, link_id)
        if link.owner_id != actor.pk:
            return {"ok": False, "error": "Chỉ được sửa liên kết rút gọn của chính bạn."}
        payload: dict[str, Any] = {}
        if args.get("name"):
            payload["name"] = str(args["name"]).strip()[:150]
        if args.get("slug"):
            payload["slug"] = str(args["slug"]).strip()
        if args.get("destination_url"):
            payload["destination_url"] = str(args["destination_url"]).strip()
        if args.get("description") is not None:
            payload["description"] = str(args["description"]).strip()[:1000]
        if "auto_redirect_seconds" in args:
            payload["auto_redirect_seconds"] = self._clamp_redirect(args["auto_redirect_seconds"])
        if "password" in args:
            payload["password"] = str(args["password"] or "")
        raw_status = str(args.get("status") or "").strip().upper()
        if raw_status == "DISABLED":
            # Model cũ có thể gửi `DISABLED`; giá trị thật của `ShortLink.Status` là `INACTIVE`.
            raw_status = ShortLink.Status.INACTIVE.value
        if raw_status in ShortLink.Status.values:
            payload["status"] = raw_status
        if "expires_at" in args:
            raw_exp = args["expires_at"]
            payload["expires_at"] = self._parse_expires_at(str(raw_exp)) if raw_exp else None
        if not payload:
            return {"ok": False, "error": "Chưa có trường nào cần cập nhật."}
        updated = self.short_link_service.update(actor, link.pk, payload)
        return {"ok": True, "updated": self._short_link_info(updated)}

    def _short_link_info(self, link: Any) -> dict[str, Any]:
        origin = get_frontend_origin(get_current_request(), prefer_configured=True)
        secs = link.auto_redirect_seconds
        mode = (
            "Chờ bấm nút" if secs is None else ("Chuyển ngay (1 giây)" if secs <= 1 else f"Đếm ngược {secs}s")
        )
        return {
            "id": str(link.pk),
            "name": link.name,
            "slug": link.slug,
            "short_url": f"{origin}/s/{link.slug}",
            "destination_url": link.destination_url,
            "auto_redirect_seconds": secs,
            "redirect_mode": mode,
            "has_password": bool(link.password_hash),
            "status": link.status,
            "expires_at": link.expires_at.isoformat() if link.expires_at else None,
        }

    def _parse_expires_at(self, raw: str) -> Any:
        parsed_date = self._parse_date(raw)
        return self.tz_service.local_to_utc(parsed_date, time(23, 59, 59), DEFAULT_TIMEZONE)

    def update_qr_code(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Cập nhật mã QR của chính `actor`."""
        qr_id = str(args.get("qr_code_id") or "").strip()
        if not qr_id:
            return {"ok": False, "error": "Thiếu `qr_code_id` cần cập nhật."}
        qr = self.qr_code_service.get_for_write(actor, qr_id)
        if qr.owner_id != actor.pk:
            return {"ok": False, "error": "Chỉ được sửa mã QR của chính bạn."}
        old_name = qr.name
        payload: dict[str, Any] = {}
        if args.get("name"):
            payload["name"] = str(args["name"]).strip()[:150]
        if args.get("content_text"):
            raw_content = str(args["content_text"]).strip()
            qr_type = str(args.get("qr_type") or qr.qr_type).strip().upper()
            if qr_type not in (QrCode.Type.URL, QrCode.Type.TEXT):
                qr_type = (
                    QrCode.Type.URL if raw_content.startswith(("http://", "https://")) else QrCode.Type.TEXT
                )
            content_dict = {"url": raw_content} if qr_type == QrCode.Type.URL else {"text": raw_content}
            validated_content, validated_design = validate_qr_content(qr_type, content_dict, qr.design)
            payload["qr_type"] = qr_type
            payload["content"] = validated_content
            payload["design"] = validated_design
        if not payload:
            return {"ok": False, "error": "Chưa có trường nào cần cập nhật."}
        updated = self.qr_code_service.update(actor, qr.pk, payload)
        return {"ok": True, "updated": {"id": str(updated.pk), "old_name": old_name, "name": updated.name}}

    def create_page(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Tạo trang tùy chỉnh cá nhân mới cho chính `actor`."""
        title = str(args.get("title") or "").strip()
        if not title:
            return {"ok": False, "error": "Tiêu đề trang không được để trống."}
        path_note = ""
        if args.get("path_segment"):
            active_path, path_note = self._resolve_page_path(
                actor, str(args["path_segment"]), create_missing=bool(args.get("create_path_if_missing"))
            )
            if active_path is None:
                return {"ok": False, "error": path_note}
        else:
            # Mặc định đường dẫn giữa đầu tiên theo thứ tự hiển thị (seed `p` = Trang).
            active_path = (
                self.page_path_service.get_queryset_for(actor)
                .filter(is_active=True)
                .order_by("position", "id")
                .first()
            )
        if active_path is None:
            return {"ok": False, "error": "Hệ thống chưa có đường dẫn gốc (PagePath) hoạt động."}
        payload: dict[str, Any] = {"title": title[:200], "path_id": active_path.pk}
        if args.get("slug"):
            payload["slug"] = str(args["slug"]).strip()
        created = self.page_service.create(actor, payload)
        return {
            "ok": True,
            "created": {
                "id": str(created.pk),
                "title": created.title,
                "path_segment": created.path.segment,
                "slug": created.slug,
                "status": created.status,
                "public_url": self.page_service.public_url(created),
                "note": path_note,
            },
        }

    def update_page(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Cập nhật trang tùy chỉnh cá nhân của chính `actor`."""
        page_id = str(args.get("page_id") or "").strip()
        if not page_id:
            return {"ok": False, "error": "Thiếu `page_id` cần cập nhật."}
        page = self.page_service.get_for_write(actor, page_id)
        if page.owner_id != actor.pk:
            return {"ok": False, "error": "Chỉ được sửa trang tùy chỉnh của chính bạn."}
        old_title = page.title
        payload: dict[str, Any] = {}
        if args.get("title"):
            payload["title"] = str(args["title"]).strip()[:200]
        if args.get("slug"):
            payload["slug"] = str(args["slug"]).strip()
        if args.get("description") is not None:
            payload["description"] = str(args["description"]).strip()[:1000]
        status = str(args.get("status") or "").strip().upper()
        if status in Page.Status.values:
            payload["status"] = status
        path_note = ""
        if args.get("path_segment"):
            path, path_note = self._resolve_page_path(
                actor, str(args["path_segment"]), create_missing=bool(args.get("create_path_if_missing"))
            )
            if path is None:
                return {"ok": False, "error": path_note}
            payload["path_id"] = path.pk
        if not payload:
            return {"ok": False, "error": "Chưa có trường nào cần cập nhật."}
        updated = self.page_service.update(actor, page.pk, payload)
        return {
            "ok": True,
            "updated": {
                "id": str(updated.pk),
                "old_title": old_title,
                "title": updated.title,
                "path_segment": updated.path.segment,
                "slug": updated.slug,
                "status": updated.status,
                "public_url": self.page_service.public_url(updated),
                "note": path_note,
            },
        }

    def _resolve_page_path(self, actor: Any, segment: str, *, create_missing: bool) -> tuple[Any, str]:
        """Tìm đường dẫn giữa theo segment; chưa có thì tạo khi được yêu cầu VÀ có quyền `page_path.create`.

        Đường dẫn giữa dùng chung toàn hệ thống (không thuộc riêng ai) nên quyền tạo theo RBAC, không theo
        owner.
        """
        path = self.page_path_service.find_by_segment(segment)
        if path is not None:
            if not path.is_active:
                return None, f"Đường dẫn giữa '{path.segment}' đang tắt, không chuyển trang vào được."
            return path, ""
        if not create_missing:
            return None, (
                f"Chưa có đường dẫn giữa '{segment}'. Hỏi người dùng có muốn tạo mới không "
                "(gọi lại với `create_path_if_missing=true`)."
            )
        can_create = getattr(actor, "is_superuser", False) or actor.has_perm(
            PagePathPermission.PATH_CREATE.code
        )
        if not can_create:
            return None, (
                f"Chưa có đường dẫn giữa '{segment}' và tài khoản chưa có quyền tạo đường dẫn giữa "
                "(dùng chung toàn hệ thống). Nhờ quản trị viên tạo hoặc chọn đường dẫn có sẵn "
                "(`list_my_records` "
                "với `resource=page_path`)."
            )
        created = self.page_path_service.create(actor, {"segment": segment, "name": segment.strip().upper()})
        return created, f"Đã tạo đường dẫn giữa mới '{created.segment}'."

    # ------------------------------------------------------------------ Xóa an toàn 2 bước
    def delete_personal_record(
        self,
        actor: Any,
        args: dict[str, Any],
        *,
        conversation_id: str = "",
        turn_id: str = "",
    ) -> dict[str, Any]:
        """Xóa bản ghi của chính chủ với chốt xác nhận 2 bước chống AI free xóa nhầm."""
        resource_type = str(args.get("resource_type") or "").strip().lower()
        record_id = str(args.get("record_id") or "").strip()
        confirmed = bool(args.get("confirmed", False))
        if not resource_type or not record_id:
            return {"ok": False, "error": "Thiếu `resource_type` hoặc `record_id` cần xóa."}

        service, summary = self._resolve_deletable(actor, resource_type, record_id)
        if service is None:
            return {"ok": False, "error": summary}

        if not confirmed:
            self.confirmation_service.stage(
                conversation_id=conversation_id,
                owner_id=actor.pk,
                resource_type=resource_type,
                record_id=record_id,
                summary=summary,
                turn_id=turn_id,
            )
            return {
                "ok": False,
                "requires_confirmation": True,
                "resource_type": resource_type,
                "record_id": record_id,
                "target_summary": summary,
                "error": (
                    f"CHỜ XÁC NHẬN: Hãy hỏi lại người dùng xác nhận có chắc chắn muốn xóa {summary} không."
                ),
            }

        ok_confirm, reason = self.confirmation_service.verify_and_consume(
            conversation_id=conversation_id,
            owner_id=actor.pk,
            resource_type=resource_type,
            record_id=record_id,
            current_turn_id=turn_id,
        )
        if not ok_confirm:
            # Nếu chưa từng qua lượt hỏi xác nhận trước đó -> đưa về trạng thái hỏi xác nhận!
            self.confirmation_service.stage(
                conversation_id=conversation_id,
                owner_id=actor.pk,
                resource_type=resource_type,
                record_id=record_id,
                summary=summary,
                turn_id=turn_id,
            )
            return {
                "ok": False,
                "requires_confirmation": True,
                "resource_type": resource_type,
                "record_id": record_id,
                "target_summary": summary,
                "error": f"{reason} Hãy hỏi lại người dùng xác nhận rõ {summary}.",
            }

        service.delete(actor, record_id)
        return {
            "ok": True,
            "deleted": {
                "resource_type": resource_type,
                "record_id": record_id,
                "summary": summary,
            },
        }

    def _resolve_deletable(self, actor: Any, resource_type: str, record_id: str) -> tuple[Any | None, str]:
        service_map: dict[str, Any] = {
            "reminder": self.reminder_service,
            "income": self.income_service,
            "asset": self.asset_service,
            "warranty_claim": self.claim_service,
            "subscription": self.subscription_service,
            "vault_item": self.vault_item_service,
            "short_link": self.short_link_service,
            "qr_code": self.qr_code_service,
            "page": self.page_service,
            "invoice": self.invoice_service,
            "platform": self.platform_service,
            "file": self.attachment_service,
            "subscription_payment": self.subscription_payment_service,
        }
        service = service_map.get(resource_type)
        if service is None:
            return None, f"Loại dữ liệu '{resource_type}' không hỗ trợ xóa qua Trợ lý AI."
        obj = service.get_for_write(actor, record_id)
        # File thư viện ghi chủ bằng `created_by`; tài nguyên khác dùng `owner`.
        owner_id = getattr(obj, "owner_id", None) or getattr(obj, "created_by_id", None)
        if owner_id != actor.pk:
            return None, "Bạn chỉ có thể xóa dữ liệu thuộc chính mình qua Trợ lý AI."
        return service, self._format_record_summary(resource_type, obj)

    @staticmethod
    def _format_record_summary(resource_type: str, obj: Any) -> str:
        if resource_type == "reminder":
            time_part = f" lúc {obj.due_time.strftime('%H:%M')}" if obj.due_time else ""
            return f"nhắc việc '{obj.title}' (ngày {obj.due_date.isoformat()}{time_part})"
        if resource_type == "income":
            plat = obj.platform.name if obj.platform else "Chưa phân loại"
            amt = f"{int(obj.amount or 0):,}".replace(",", ".")
            return (
                f"khoản thu '{obj.content or plat}' ({amt} đ, ngày {obj.received_date.isoformat()}, {plat})"
            )
        if resource_type == "asset":
            return f"thiết bị '{obj.name}'"
        if resource_type == "warranty_claim":
            return f"phiếu bảo hành '{obj.claim_code}'"
        if resource_type == "subscription":
            return f"dịch vụ '{obj.name}' (gia hạn {obj.renew_date.isoformat()})"
        if resource_type == "vault_item":
            return f"mục két sắt '{obj.title}'"
        if resource_type == "short_link":
            return f"link rút gọn '{obj.slug}' ({obj.destination_url})"
        if resource_type == "page":
            return f"trang cá nhân '{obj.title}'"
        if resource_type == "qr_code":
            return f"mã QR '{obj.name}'"
        if resource_type == "invoice":
            return f"hóa đơn '{obj.number or obj.issuer}' (ngày {obj.issued_on.isoformat()})"
        if resource_type == "platform":
            return f"nền tảng '{obj.name}'"
        if resource_type == "file":
            return f"file '{obj.original_name}'"
        if resource_type == "subscription_payment":
            return f"lần thanh toán ngày {obj.paid_on.isoformat()} của dịch vụ '{obj.subscription.name}'"
        return str(obj)

    # ------------------------------------------------------------------ Helpers
    @staticmethod
    def _match_platforms(platforms: list[Platform], query: str) -> list[Platform]:
        q = query.strip().lower()
        exact = [p for p in platforms if p.name.lower() == q or p.code.lower() == q]
        if exact:
            return exact
        partial = [p for p in platforms if q in p.name.lower() or q in p.code.lower()]
        if partial:
            return partial
        # Hỗ trợ khớp tiền tố 3 ký tự (VD: "afff" -> "aff" khớp "Affiliate")
        if len(q) >= 3:
            prefix = q[:3]
            return [p for p in platforms if prefix in p.name.lower() or prefix in p.code.lower()]
        return []

    @staticmethod
    def _parse_amount(raw: Any) -> Decimal:
        if raw is None or raw == "":
            return Decimal(0)
        if isinstance(raw, (int, float, Decimal)):
            return Decimal(str(raw))
        text = str(raw).strip().lower().replace(",", "").replace(" ", "").replace("đ", "").replace("vnd", "")
        match = re.fullmatch(r"(\d+(?:\.\d+)?)(k|nghin|tr|trieu|m)?(\d+)?", text)
        if match:
            num = Decimal(match.group(1))
            unit = match.group(2) or ""
            tail = match.group(3) or ""
            if unit and tail and "." not in match.group(1):
                num = Decimal(f"{match.group(1)}.{tail}")
            if unit in ("k", "nghin"):
                return num * Decimal(1000)
            if unit in ("tr", "trieu", "m"):
                return num * Decimal(1000000)
            return num
        text_digits = text.replace(".", "")
        try:
            return Decimal(text_digits)
        except InvalidOperation as exc:
            raise ValueError(f"Số tiền '{raw}' không hợp lệ.") from exc

    def parse_date(self, raw: str) -> date:
        """Chuẩn hóa chuỗi ngày YYYY-MM-DD hoặc DD/MM/YYYY."""
        return self._parse_date(raw)

    @staticmethod
    def _parse_date(raw: str) -> date:
        cleaned = raw.strip()
        if "T" in cleaned:
            cleaned = cleaned.split("T", 1)[0].strip()
        if "/" in cleaned:
            parts = cleaned.split("/")
            if len(parts) == 3 and all(p.isdigit() for p in parts):
                return date(int(parts[2]), int(parts[1]), int(parts[0]))
        return date.fromisoformat(cleaned)

    def _parse_time(self, raw: str) -> time | None:
        cleaned = raw.strip().lower()
        if "h" in cleaned and ":" not in cleaned:
            hh, _, mm = cleaned.partition("h")
            if hh.isdigit() and (not mm or mm.isdigit()):
                cleaned = f"{int(hh):02d}:{int(mm or '0'):02d}"
        if len(cleaned.split(":")) == 3:
            cleaned = ":".join(cleaned.split(":")[:2])
        if ":" in cleaned:
            hh, mm = cleaned.split(":", 1)
            if hh.isdigit() and mm.isdigit():
                cleaned = f"{int(hh):02d}:{int(mm):02d}"
        return self.tz_service.parse_hhmm(cleaned)

    @staticmethod
    def _normalize_priority(raw: Any) -> str:
        text = str(raw or Reminder.Priority.MEDIUM).strip().upper()
        alias_map = {
            "THẤP": Reminder.Priority.LOW,
            "THAP": Reminder.Priority.LOW,
            "TRUNG BÌNH": Reminder.Priority.MEDIUM,
            "TRUNG BINH": Reminder.Priority.MEDIUM,
            "CAO": Reminder.Priority.HIGH,
            "KHẨN CẤP": Reminder.Priority.URGENT,
            "KHAN CAP": Reminder.Priority.URGENT,
        }
        candidate = alias_map.get(text, text)
        if candidate in {c[0] for c in Reminder.Priority.choices}:
            return str(candidate)
        return str(Reminder.Priority.MEDIUM)
