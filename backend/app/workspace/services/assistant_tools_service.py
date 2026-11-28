"""Bộ Agentic Tools của Trợ lý AI: allowlist chặt chẽ, phân quyền RBAC, chỉ dữ liệu cá nhân Client Portal."""

import json
from datetime import timedelta
from decimal import Decimal
from typing import Any

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone as dj_timezone

from app.core.constants.defaults import DEFAULT_TIMEZONE
from app.core.context.user_context import get_current_request
from app.core.exceptions.app_exception import AppException
from app.finance.permissions.income_permission import IncomePermission
from app.finance.services.finance_report_service import FinanceReportService
from app.finance.services.platform_service import PlatformService
from app.novel.services.novel_service import NovelService
from app.system.services.current_user_service import CurrentUserService
from app.system.utils.frontend_url import get_frontend_origin
from app.utilities.permissions.page_permission import PagePermission
from app.utilities.permissions.qr_code_permission import QrCodePermission
from app.utilities.permissions.short_link_permission import ShortLinkPermission
from app.utilities.services.page_service import PageService
from app.utilities.services.qr_code_service import QrCodeService
from app.utilities.services.short_link_service import ShortLinkService
from app.workspace.constants.assistant_scope_rules import PROFILE_INTENT_PHRASES
from app.workspace.constants.assistant_tool_permissions import (
    ALL_TOOL_NAMES,
    DELETE_RESOURCE_PERMISSION_MAP,
    OWNER_MUTATION_TOOL_NAMES,
    OWNER_SENSITIVE_READ_TOOL_NAMES,
    TOOL_PERMISSION_MAP,
)
from app.workspace.constants.assistant_tool_schemas import build_assistant_tool_schemas
from app.workspace.constants.workspace_defaults import (
    AI_TOOL_ITEM_LIMIT,
    ALLOWED_CALENDAR_TYPES,
    STALE_PROJECT_DAYS,
)
from app.workspace.models.asset import Asset
from app.workspace.permissions.asset_permission import AssetPermission
from app.workspace.permissions.reminder_permission import ReminderPermission
from app.workspace.permissions.subscription_permission import SubscriptionPermission
from app.workspace.permissions.vault_item_permission import VaultItemPermission
from app.workspace.services.asset_service import AssetService
from app.workspace.services.asset_warranty_claim_service import AssetWarrantyClaimService
from app.workspace.services.assistant_draft_service import AssistantDraftService
from app.workspace.services.assistant_record_tools_service import AssistantRecordToolsService
from app.workspace.services.assistant_tool_spec_builder import AssistantToolSpecBuilder
from app.workspace.services.assistant_write_tools_service import AssistantWriteToolsService
from app.workspace.services.reminder_service import ReminderService
from app.workspace.services.subscription_service import SubscriptionService
from app.workspace.services.vault_item_service import VaultItemService
from app.workspace.services.workspace_calendar_service import WorkspaceCalendarService
from app.workspace.services.workspace_spending_service import WorkspaceSpendingService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService


class AssistantToolsService:
    """Thực thi các tool cá nhân Client Portal an toàn; tuyệt đối không truy cập quản trị Admin."""

    def __init__(
        self,
        spending_service: WorkspaceSpendingService | None = None,
        finance_report_service: FinanceReportService | None = None,
        platform_service: PlatformService | None = None,
        subscription_service: SubscriptionService | None = None,
        reminder_service: ReminderService | None = None,
        asset_service: AssetService | None = None,
        warranty_claim_service: AssetWarrantyClaimService | None = None,
        vault_item_service: VaultItemService | None = None,
        short_link_service: ShortLinkService | None = None,
        qr_code_service: QrCodeService | None = None,
        page_service: PageService | None = None,
        novel_service: NovelService | None = None,
        current_user_service: CurrentUserService | None = None,
        calendar_service: WorkspaceCalendarService | None = None,
        tz_service: WorkspaceTimezoneService | None = None,
        write_tools: AssistantWriteToolsService | None = None,
        draft_service: AssistantDraftService | None = None,
        spec_builder: AssistantToolSpecBuilder | None = None,
        record_tools: AssistantRecordToolsService | None = None,
    ) -> None:
        """Khởi tạo toàn bộ service nghiệp vụ cá nhân được phép gọi từ Trợ lý AI."""
        self.spending_service = spending_service or WorkspaceSpendingService()
        self.finance_report_service = finance_report_service or FinanceReportService()
        self.platform_service = platform_service or PlatformService()
        self.subscription_service = subscription_service or SubscriptionService()
        self.reminder_service = reminder_service or ReminderService()
        self.asset_service = asset_service or AssetService()
        self.warranty_claim_service = warranty_claim_service or AssetWarrantyClaimService()
        self.vault_item_service = vault_item_service or VaultItemService()
        self.short_link_service = short_link_service or ShortLinkService()
        self.qr_code_service = qr_code_service or QrCodeService()
        self.page_service = page_service or PageService()
        self.novel_service = novel_service or NovelService()
        self.current_user_service = current_user_service or CurrentUserService()
        self.calendar_service = calendar_service or WorkspaceCalendarService()
        self.tz_service = tz_service or WorkspaceTimezoneService()
        self.mutation_tools = write_tools or AssistantWriteToolsService(
            reminder_service=self.reminder_service,
            platform_service=self.platform_service,
            asset_service=self.asset_service,
            claim_service=self.warranty_claim_service,
            subscription_service=self.subscription_service,
            short_link_service=self.short_link_service,
            qr_code_service=self.qr_code_service,
            page_service=self.page_service,
            vault_item_service=self.vault_item_service,
            current_user_service=self.current_user_service,
            tz_service=self.tz_service,
        )
        self.spec_builder = spec_builder or AssistantToolSpecBuilder()
        self.record_tools = record_tools or AssistantRecordToolsService(
            platform_service=self.platform_service
        )
        self.draft_service = draft_service or AssistantDraftService(spec_builder=self.spec_builder)

    def tool_schemas(self, *, is_owner: bool = True, actor: Any | None = None) -> list[dict[str, Any]]:
        """Schema OpenAI function calling (lọc theo RBAC), mô tả/enum field bổ sung từ metadata model."""
        return self.spec_builder.enrich_schemas(build_assistant_tool_schemas(is_owner=is_owner, actor=actor))

    def execute_tool(
        self,
        actor: Any,
        name: str,
        raw_arguments: Any,
        *,
        is_owner: bool = True,
        hide_amounts: bool = False,
        conversation_id: str = "",
        turn_id: str = "",
        user_text: str | None = None,
    ) -> dict[str, Any]:
        """Kiểm allowlist, phân quyền RBAC, ép lọc `owner_id=actor.pk` và trả JSON tối giản.

        `user_text` là tin người dùng ở lượt chat hiện tại (None khi gọi nội bộ/test): tool có spec ô cần hỏi
        dùng nó để biết người dùng đã tự quyết hay model đang tự điền.
        """
        if name not in ALL_TOOL_NAMES:
            return {"ok": False, "error": f"Tool '{name}' không nằm trong danh sách cho phép."}
        if (name in OWNER_MUTATION_TOOL_NAMES or name in OWNER_SENSITIVE_READ_TOOL_NAMES) and not is_owner:
            return {"ok": False, "error": "Chỉ chủ sở hữu mới có quyền truy cập hoặc thay đổi dữ liệu này."}

        args = self._parse_args(raw_arguments)
        perm_error = self._check_permission(actor, name, args)
        if perm_error:
            return {"ok": False, "error": perm_error}

        if name == "update_my_profile" and user_text is not None and not self._mentions_profile(user_text):
            return {
                "ok": False,
                "error": (
                    "Câu này không nói rõ đổi tên HỒ SƠ của bạn. Nếu đổi tên bản ghi vừa tạo/sửa, dùng tool "
                    "`update_*` với ID trong khối BẢN GHI VỪA THAO TÁC; chưa rõ bản ghi nào thì hỏi lại."
                ),
            }

        draft_result = self._apply_draft_rules(
            actor, name, args, user_text=user_text, conversation_id=conversation_id, turn_id=turn_id
        )
        if draft_result is not None:
            return draft_result

        try:
            read_dispatch: dict[str, Any] = {
                "get_my_capabilities": lambda: self._run_my_capabilities(actor),
                "get_my_profile": lambda: self._run_my_profile(actor),
                "get_personal_statistics": lambda: self._run_personal_statistics(
                    actor, args, hide_amounts=hide_amounts
                ),
                "get_upcoming_events": lambda: self._run_upcoming_events(
                    actor, args, hide_amounts=hide_amounts
                ),
                "get_spending_summary": lambda: self._run_spending(actor, args, hide_amounts=hide_amounts),
                "get_finance_income_summary": lambda: self._run_finance_income(
                    actor, args, hide_amounts=hide_amounts
                ),
                "list_finance_platforms": lambda: self._run_finance_platforms(actor),
                "get_upcoming_subscriptions": lambda: self._run_subscriptions(
                    actor, args, hide_amounts=hide_amounts
                ),
                "get_pending_reminders": lambda: self._run_reminders(actor, args),
                "get_assets_and_warranty": lambda: self._run_assets(actor, args, hide_amounts=hide_amounts),
                "list_warranty_claims": lambda: self._run_warranty_claims(
                    actor, args, hide_amounts=hide_amounts
                ),
                "list_vault_items": lambda: self._run_vault_items(actor, args),
                "reveal_vault_secret": lambda: self._run_reveal_vault_secret(actor, args),
                "get_stale_projects": lambda: self._run_stale_projects(actor, args),
                "list_short_links": lambda: self._run_short_links(actor, args),
                "list_qr_codes": lambda: self._run_qr_codes(actor, args),
                "list_pages": lambda: self._run_pages(actor, args),
                "list_my_records": lambda: self.record_tools.list_records(actor, args),
            }
            # Một tool = một transaction: `get_for_write` dùng `select_for_update` (cần transaction)
            # và thao tác ghi lỗi giữa chừng được rollback trọn vẹn.
            with transaction.atomic():
                if name in read_dispatch:
                    return dict(read_dispatch[name]())
                return self._execute_mutation(
                    actor,
                    name,
                    args,
                    conversation_id=conversation_id,
                    turn_id=turn_id,
                )
        except (AppException, ValueError, TypeError) as exc:
            return {"ok": False, "error": str(exc)}

    def _mentions_profile(self, user_text: str) -> bool:
        """Câu có nói rõ hồ sơ/tên của chính người dùng không (điều kiện để đổi tên tài khoản)."""
        padded = f" {self.spec_builder.normalize(user_text)} "
        return any(f" {phrase} " in padded for phrase in PROFILE_INTENT_PHRASES)

    def _apply_draft_rules(
        self,
        actor: Any,
        name: str,
        args: dict[str, Any],
        *,
        user_text: str | None,
        conversation_id: str,
        turn_id: str,
    ) -> dict[str, Any] | None:
        """Luật nháp chung cho mọi tool tạo có khai ô cần hỏi (sửa `args` tại chỗ).

        - Trong chat (`user_text` khác None): bỏ `slot_values` model gửi; ô người dùng chưa tự nêu thì lập
          nháp và trả câu hỏi (không tạo). Đủ ô → ghi lựa chọn người dùng đè lên giá trị model tự điền.
        - Gọi nội bộ (`user_text=None`, VD hoàn tất nháp): tin `slot_values` và ghi vào tham số.
        """
        spec = self.draft_service.spec_for(name)
        raw_slot_values = args.pop("slot_values", None)
        args.pop("draft_token", None)
        if spec is None:
            return None
        if user_text is None:
            if isinstance(raw_slot_values, dict):
                args.update(self.draft_service.merge_into_args(spec, args, raw_slot_values))
            return None
        notes: list[str] = []
        preparer = self.mutation_tools.draft_preparers().get(name)
        if preparer is not None:
            notes = preparer(args)
        chosen = self.draft_service.detect_from_text(spec, user_text, args)
        missing = self.draft_service.missing_slots(spec, chosen, args)
        if missing:
            question = self.draft_service.start(
                spec=spec,
                conversation_id=conversation_id,
                owner_id=actor.pk,
                args=args,
                chosen=chosen,
                turn_id=turn_id,
            )
            if question is not None:
                return {
                    "ok": True,
                    "needs_choice": question,
                    "draft": {
                        "title": spec.title,
                        # Tóm tắt điều đã chốt; bỏ giá trị model tự đoán cho ô sắp hỏi.
                        "fields": self.spec_builder.describe_args(
                            name,
                            {
                                key: value
                                for key, value in self.draft_service.merge_into_args(
                                    spec, args, chosen
                                ).items()
                                if key not in missing
                            },
                        ),
                        "notes": notes,
                    },
                }
        args.update(self.draft_service.merge_into_args(spec, args, chosen))
        return None

    def _check_permission(self, actor: Any, name: str, args: dict[str, Any]) -> str | None:
        if getattr(actor, "is_superuser", False):
            return None
        required_perm = TOOL_PERMISSION_MAP.get(name)
        if name == "delete_personal_record":
            resource_type = str(args.get("resource_type") or "").strip()
            required_perm = DELETE_RESOURCE_PERMISSION_MAP.get(resource_type)
        if required_perm and not actor.has_perm(required_perm):
            return f"Bạn chưa được cấp quyền `{required_perm}` để thực hiện thao tác này."
        return None

    def _execute_mutation(
        self,
        actor: Any,
        name: str,
        args: dict[str, Any],
        *,
        conversation_id: str,
        turn_id: str,
    ) -> dict[str, Any]:
        if name == "delete_personal_record":
            return self.mutation_tools.delete_personal_record(
                actor,
                args,
                conversation_id=conversation_id,
                turn_id=turn_id,
            )
        if name == "update_my_record":
            return self.record_tools.update_record(actor, args)
        dispatch: dict[str, Any] = {
            "update_my_profile": self.mutation_tools.update_my_profile,
            "create_vault_item": self.mutation_tools.create_vault_item,
            "update_vault_item": self.mutation_tools.update_vault_item,
            "create_quick_reminder": self.mutation_tools.create_quick_reminder,
            "update_reminder": self.mutation_tools.update_reminder,
            "create_finance_income": self.mutation_tools.create_finance_income,
            "create_finance_platform": self.mutation_tools.create_finance_platform,
            "update_finance_income": self.mutation_tools.update_finance_income,
            "create_asset": self.mutation_tools.create_asset,
            "update_asset": self.mutation_tools.update_asset,
            "create_warranty_claim": self.mutation_tools.create_warranty_claim,
            "update_warranty_claim": self.mutation_tools.update_warranty_claim,
            "create_subscription": self.mutation_tools.create_subscription,
            "update_subscription": self.mutation_tools.update_subscription,
            "renew_subscription": self.mutation_tools.renew_subscription,
            "create_short_link": self.mutation_tools.create_short_link,
            "update_short_link": self.mutation_tools.update_short_link,
            "create_qr_code": self.mutation_tools.create_qr_code,
            "update_qr_code": self.mutation_tools.update_qr_code,
            "create_page": self.mutation_tools.create_page,
            "update_page": self.mutation_tools.update_page,
        }
        return dict(dispatch[name](actor, args))

    def _has_perm(self, actor: Any, perm: str) -> bool:
        return bool(getattr(actor, "is_superuser", False) or actor.has_perm(perm))

    def _run_my_capabilities(self, actor: Any) -> dict[str, Any]:
        modules = [
            {
                "module": "Hồ sơ cá nhân",
                "enabled": True,
                "actions": ["Xem thông tin cá nhân", "Đổi tên hiển thị"],
            },
            {
                "module": "Nhắc việc cá nhân",
                "enabled": self._has_perm(actor, ReminderPermission.READ.code),
                "actions": ["Xem việc hôm nay/quá hạn/tuần", "Tạo mới", "Sửa/Hoàn thành", "Xóa (2 bước)"],
            },
            {
                "module": "Tài chính cá nhân",
                "enabled": self._has_perm(actor, IncomePermission.READ.code),
                "actions": [
                    "Xem dòng tiền theo N ngày/tháng",
                    "Ghi thu nhập nhanh",
                    "Tạo nền tảng",
                    "Sửa/Xóa",
                ],
            },
            {
                "module": "Thiết bị & Bảo hành",
                "enabled": self._has_perm(actor, AssetPermission.READ.code),
                "actions": [
                    "Tra cứu thiết bị & bảo hành",
                    "Thêm/Sửa thiết bị",
                    "Tạo/Sửa phiếu bảo hành",
                    "Xóa",
                ],
            },
            {
                "module": "Dịch vụ định kỳ",
                "enabled": self._has_perm(actor, SubscriptionPermission.READ.code),
                "actions": ["Xem dịch vụ sắp gia hạn", "Thêm/Sửa dịch vụ", "Ghi nhận gia hạn", "Xóa"],
            },
            {
                "module": "Két sắt bí mật",
                "enabled": self._has_perm(actor, VaultItemPermission.READ.code),
                "actions": [
                    "Tìm kiếm mục Két sắt",
                    "Giải mã xem mã số/mật khẩu"
                    if self._has_perm(actor, VaultItemPermission.REVEAL.code)
                    else "(Thiếu quyền giải mã)",
                    "Thêm/Sửa/Xóa mục Két sắt",
                ],
            },
            {
                "module": "Tiện ích (Link rút gọn, Mã QR, Trang cá nhân)",
                "enabled": (
                    self._has_perm(actor, ShortLinkPermission.READ.code)
                    or self._has_perm(actor, QrCodePermission.READ.code)
                    or self._has_perm(actor, PagePermission.READ.code)
                ),
                "actions": [
                    "Xem/Tạo/Sửa/Xóa link rút gọn",
                    "Xem/Tạo/Sửa/Xóa mã QR",
                    "Xem/Tạo/Sửa trang cá nhân",
                ],
            },
            {
                "module": "Lịch tổng hợp & Thống kê cá nhân",
                "enabled": True,
                "actions": ["Xem sự kiện sắp tới", "Xem tổng hợp chi tiêu & thống kê toàn bộ cá nhân"],
            },
        ]
        return {
            "ok": True,
            "scope": "CLIENT_PORTAL_ONLY",
            "modules": [m for m in modules if m["enabled"]],
        }

    def _run_my_profile(self, actor: Any) -> dict[str, Any]:
        profile = self.current_user_service.get_profile(actor)
        user = profile.user
        return {
            "ok": True,
            "profile": {
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "is_verified": bool(user.is_verified),
                "date_joined": user.date_joined.date().isoformat() if user.date_joined else "",
                "roles": [r.name for r in profile.roles],
            },
        }

    def _run_personal_statistics(
        self, actor: Any, args: dict[str, Any], *, hide_amounts: bool
    ) -> dict[str, Any]:
        today_local = self.tz_service.local_today(DEFAULT_TIMEZONE)
        days = self._int_arg(args.get("days"), 1, 365) if args.get("days") is not None else None
        month = (
            self._int_arg(args.get("month"), 1, 12) if args.get("month") is not None else today_local.month
        )
        year = self._int_arg(args.get("year"), 2020, 2100) or today_local.year

        stats: dict[str, Any] = {"ok": True, "year": year, "month": month}
        if self._has_perm(actor, IncomePermission.READ.code):
            if days is not None:
                rep = self.finance_report_service.range_summary(
                    actor, today_local - timedelta(days=days - 1), today_local, owner_ids=[actor.pk]
                )
                stats["days"] = days
            else:
                rep = self.finance_report_service.summary(actor, year, month, owner_ids=[actor.pk])
            totals = rep.get("totals") or {}
            stats["income"] = {
                "count": int(totals.get("count") or 0),
                "total_vnd": self._money(totals.get("total", 0), hide_amounts),
            }

        spending = self.spending_service.summary(actor, month=month, year=year, owner=actor)
        stats["spending"] = {
            "total_spent_vnd": self._money(spending["total_spent_vnd"], hide_amounts),
            "projected_subscriptions_vnd": self._money(spending["projected_subscriptions_vnd"], hide_amounts),
        }

        if self._has_perm(actor, ReminderPermission.READ.code):
            rem_qs = self.reminder_service.get_queryset_for(actor).filter(owner_id=actor.pk)
            stats["reminders"] = {
                "pending": rem_qs.filter(is_completed=False).count(),
                "overdue": rem_qs.filter(is_completed=False, due_date__lt=today_local).count(),
                "completed": rem_qs.filter(is_completed=True).count(),
            }
        if self._has_perm(actor, AssetPermission.READ.code):
            asset_qs = self.asset_service.get_queryset_for(actor).filter(owner_id=actor.pk)
            stats["assets"] = {"total": asset_qs.count()}
        if self._has_perm(actor, SubscriptionPermission.READ.code):
            sub_qs = self.subscription_service.get_queryset_for(actor).filter(owner_id=actor.pk)
            stats["subscriptions"] = {"total": sub_qs.count()}
        if self._has_perm(actor, ShortLinkPermission.READ.code):
            sl_qs = self.short_link_service.get_queryset_for(actor).filter(owner_id=actor.pk)
            clicks = sl_qs.aggregate(total_clicks=Sum("clicks_count")).get("total_clicks") or 0
            stats["short_links"] = {"total": sl_qs.count(), "total_clicks": int(clicks)}
        if self._has_perm(actor, QrCodePermission.READ.code):
            stats["qr_codes"] = {
                "total": self.qr_code_service.get_queryset_for(actor).filter(owner_id=actor.pk).count()
            }
        if self._has_perm(actor, VaultItemPermission.READ.code):
            stats["vault_items"] = {
                "total": self.vault_item_service.get_queryset_for(actor).filter(owner_id=actor.pk).count()
            }
        return stats

    def _run_vault_items(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        query = str(args.get("query") or "").strip().lower()
        qs = self.vault_item_service.get_queryset_for(actor).filter(owner_id=actor.pk).order_by("title")
        items = list(qs[:50])
        if query:
            items = [
                item
                for item in items
                if query in item.title.lower()
                or query in item.category.lower()
                or query in item.username.lower()
                or query in item.url.lower()
            ]
        return {
            "ok": True,
            "total_count": len(items),
            "items": [
                {
                    "id": str(item.pk),
                    "title": item.title,
                    "category": item.category,
                    "username": item.username,
                    "secret_last4": item.secret_last4,
                    "url": item.url,
                    "notes": item.notes,
                }
                for item in items[:AI_TOOL_ITEM_LIMIT]
            ],
        }

    def _run_reveal_vault_secret(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        item_id = str(args.get("vault_item_id") or "").strip()
        if not item_id:
            return {"ok": False, "error": "Thiếu `vault_item_id` cần giải mã."}
        item = self.vault_item_service.get_for_write(actor, item_id)
        if item.owner_id != actor.pk:
            return {"ok": False, "error": "Chỉ được đọc mã bí mật Két sắt của chính bạn."}
        revealed = self.vault_item_service.reveal(actor, item.pk)
        return {
            "ok": True,
            "item": {
                "id": revealed["id"],
                "title": revealed["title"],
                "username": revealed["username"],
                "secret": revealed["secret"],
                "url": revealed["url"],
            },
        }

    def _run_qr_codes(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        query = str(args.get("query") or "").strip()
        qs = self.qr_code_service.get_queryset_for(actor).filter(owner_id=actor.pk).order_by("-created_at")
        if query:
            qs = qs.filter(name__icontains=query)
        items = list(qs[:AI_TOOL_ITEM_LIMIT])
        return {
            "ok": True,
            "total_count": len(items),
            "items": [
                {"id": str(item.pk), "name": item.name, "qr_type": item.qr_type, "payload": item.payload}
                for item in items
            ],
        }

    def _run_pages(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        query = str(args.get("query") or "").strip()
        qs = self.page_service.get_queryset_for(actor).filter(owner_id=actor.pk).order_by("-updated_at")
        if query:
            qs = qs.filter(title__icontains=query)
        items = list(qs[:AI_TOOL_ITEM_LIMIT])
        return {
            "ok": True,
            "total_count": len(items),
            "items": [
                {
                    "id": str(item.pk),
                    "title": item.title,
                    "slug": item.slug,
                    "status": item.status,
                }
                for item in items
            ],
        }

    def _run_upcoming_events(self, actor: Any, args: dict[str, Any], *, hide_amounts: bool) -> dict[str, Any]:
        days = self._int_arg(args.get("days_ahead"), 1, 90) or 14
        type_perm_map = {
            "reminder": ReminderPermission.READ.code,
            "subscription": SubscriptionPermission.READ.code,
            "asset_warranty": AssetPermission.READ.code,
            "warranty_claim": AssetPermission.READ.code,
            "income": IncomePermission.READ.code,
        }
        allowed_types = {
            t
            for t in ALLOWED_CALENDAR_TYPES
            if t not in type_perm_map or self._has_perm(actor, type_perm_map[t])
        }
        raw_types = args.get("types")
        if isinstance(raw_types, list):
            selected_types = [str(item).strip() for item in raw_types if str(item).strip() in allowed_types]
        else:
            selected_types = sorted(allowed_types)
        if not selected_types:
            return {"ok": True, "days_ahead": days, "total_count": 0, "items": []}
        today_local = self.tz_service.local_today(DEFAULT_TIMEZONE)
        calendar_data = self.calendar_service.events(
            actor,
            from_date=today_local,
            to_date=today_local + timedelta(days=days - 1),
            types=selected_types,
        )
        active = [item for item in (calendar_data.get("events") or []) if not item.get("is_completed")]
        return {
            "ok": True,
            "from_date": calendar_data["from_date"].isoformat(),
            "to_date": calendar_data["to_date"].isoformat(),
            "days_ahead": days,
            "total_count": len(active),
            "items": [
                {
                    "type": item["type"],
                    "date": item["date"].isoformat(),
                    "time": item.get("time") or "",
                    "title": item["title"],
                    "subtitle": item.get("subtitle") or "",
                    "status": item.get("status") or "",
                    "amount_vnd": (
                        self._money(item["amount_vnd"], hide_amounts)
                        if item.get("amount_vnd") is not None
                        else None
                    ),
                }
                for item in active[:AI_TOOL_ITEM_LIMIT]
            ],
        }

    def _run_spending(self, actor: Any, args: dict[str, Any], *, hide_amounts: bool) -> dict[str, Any]:
        month = self._int_arg(args.get("month"), 1, 12) if args.get("month") is not None else None
        year = self._int_arg(args.get("year"), 2020, 2100) if args.get("year") is not None else None
        data = self.spending_service.summary(actor, month=month, year=year, owner=actor)
        return {
            "ok": True,
            "year": data["year"],
            "month": data["month"],
            "total_spent_vnd": self._money(data["total_spent_vnd"], hide_amounts),
            "subscription_paid_vnd": self._money(data["subscription_paid_vnd"], hide_amounts),
            "asset_purchase_vnd": self._money(data["asset_purchase_vnd"], hide_amounts),
            "warranty_repair_vnd": self._money(data["warranty_repair_vnd"], hide_amounts),
            "projected_subscriptions_vnd": self._money(data["projected_subscriptions_vnd"], hide_amounts),
        }

    def _run_finance_income(self, actor: Any, args: dict[str, Any], *, hide_amounts: bool) -> dict[str, Any]:
        today_local = self.tz_service.local_today(DEFAULT_TIMEZONE)
        platform_filter = str(args.get("platform_name") or "").strip()
        days = self._int_arg(args.get("days"), 1, 365) if args.get("days") is not None else None

        if days is not None or args.get("from_date") or args.get("to_date"):
            if days is not None:
                to_date = today_local
                from_date = today_local - timedelta(days=days - 1)
            else:
                from_date = (
                    self.mutation_tools.parse_date(str(args["from_date"]))
                    if args.get("from_date")
                    else today_local - timedelta(days=6)
                )
                to_date = (
                    self.mutation_tools.parse_date(str(args["to_date"]))
                    if args.get("to_date")
                    else today_local
                )
            report = self.finance_report_service.range_summary(
                actor,
                from_date,
                to_date,
                owner_ids=[actor.pk],
                platform_filter=platform_filter,
                item_limit=AI_TOOL_ITEM_LIMIT,
            )
            totals = report.get("totals") or {}
            return {
                "ok": True,
                "from_date": from_date.isoformat(),
                "to_date": to_date.isoformat(),
                "days": (to_date - from_date).days + 1,
                "total_vnd": self._money(totals.get("total", 0), hide_amounts),
                "tax_vnd": self._money(totals.get("tax", 0), hide_amounts),
                "count": int(totals.get("count") or 0),
                "by_day": [
                    {
                        "date": row["date"].isoformat(),
                        "count": row["count"],
                        "total_vnd": self._money(row["total"], hide_amounts),
                    }
                    for row in (report.get("by_day") or [])[:AI_TOOL_ITEM_LIMIT]
                ],
                "platforms": [
                    {
                        "platform": row.get("platform") or "",
                        "count": int(row.get("count") or 0),
                        "total_vnd": self._money(row.get("total", 0), hide_amounts),
                    }
                    for row in (report.get("by_platform") or [])[:AI_TOOL_ITEM_LIMIT]
                ],
                "items": [
                    {
                        "id": row["id"],
                        "date": row["date"].isoformat(),
                        "platform": row["platform"],
                        "content": row["content"],
                        "amount_vnd": self._money(row["amount"], hide_amounts),
                    }
                    for row in (report.get("items") or [])
                ],
            }

        year = self._int_arg(args.get("year"), 2020, 2100) or today_local.year
        month = self._int_arg(args.get("month"), 1, 12) if args.get("month") is not None else None
        report = self.finance_report_service.summary(actor, year, month, owner_ids=[actor.pk])
        platforms = report.get("by_platform") or []
        if platform_filter:
            needle = platform_filter.lower()
            platforms = [row for row in platforms if needle in str(row.get("platform") or "").lower()]
        totals = report.get("totals") or {}
        return {
            "ok": True,
            "year": year,
            "month": month,
            "total_vnd": self._money(totals.get("total", 0), hide_amounts),
            "tax_vnd": self._money(totals.get("tax", 0), hide_amounts),
            "count": int(totals.get("count") or 0),
            "platforms": [
                {
                    "platform": row.get("platform") or "",
                    "count": int(row.get("count") or 0),
                    "total_vnd": self._money(row.get("total", 0), hide_amounts),
                }
                for row in platforms[:AI_TOOL_ITEM_LIMIT]
            ],
        }

    def _run_finance_platforms(self, actor: Any) -> dict[str, Any]:
        platforms = list(
            self.platform_service.get_queryset_for(actor)
            .filter(owner_id=actor.pk, is_active=True)
            .select_related("default_currency")
            .order_by("name")[:AI_TOOL_ITEM_LIMIT]
        )
        return {
            "ok": True,
            "total_count": len(platforms),
            "items": [
                {
                    "id": str(p.pk),
                    "name": p.name,
                    "code": p.code,
                    "currency": p.default_currency.code if p.default_currency else "VND",
                }
                for p in platforms
            ],
        }

    def _run_subscriptions(self, actor: Any, args: dict[str, Any], *, hide_amounts: bool) -> dict[str, Any]:
        days = self._int_arg(args.get("days_ahead"), 1, 90) or 14
        items, total = self.subscription_service.get_upcoming(actor, days_ahead=days)
        return {
            "ok": True,
            "days_ahead": days,
            "total_count": total,
            "items": [
                {
                    "id": str(item.pk),
                    "name": item.name,
                    "provider": item.provider,
                    "renew_date": item.renew_date.isoformat(),
                    "amount_vnd": self._money(item.amount_vnd, hide_amounts),
                    "auto_renew": item.auto_renew,
                }
                for item in items
            ],
        }

    def _run_reminders(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        scope = str(args.get("scope") or "today").strip()
        if scope not in ("today", "overdue", "week", "all"):
            scope = "today"
        query = str(args.get("query") or "").strip().lower()
        items, total = self.reminder_service.get_pending(actor, scope=scope)
        if query:
            items = [item for item in items if query in item.title.lower()]
            total = len(items)
        return {
            "ok": True,
            "scope": scope,
            "total_count": total,
            "items": [
                {
                    "id": str(item.pk),
                    "title": item.title,
                    "due_date": item.due_date.isoformat(),
                    "due_time": item.due_time.strftime("%H:%M") if item.due_time else "",
                    "notify_minutes_before": item.notify_minutes_before,
                    "recurrence": item.recurrence,
                    "priority": item.priority,
                }
                for item in items[:AI_TOOL_ITEM_LIMIT]
            ],
        }

    def _run_assets(self, actor: Any, args: dict[str, Any], *, hide_amounts: bool) -> dict[str, Any]:
        query = str(args.get("query") or "").strip()[:100]
        status = str(args.get("status") or "").strip()
        valid_statuses = {c[0] for c in Asset.Status.choices}
        if status and status not in valid_statuses:
            status = ""
        items, total = self.asset_service.search_with_warranty_summary(actor, query=query, status=status)
        return {
            "ok": True,
            "total_count": total,
            "items": [
                {
                    "id": str(item.pk),
                    "name": item.name,
                    "brand": item.brand,
                    "status": item.status,
                    "purchase_store": item.purchase_store,
                    "purchase_price_vnd": self._money(item.purchase_price_vnd, hide_amounts),
                    "warranty_end_date": (
                        item.warranty_end_date.isoformat() if item.warranty_end_date else None
                    ),
                }
                for item in items
            ],
        }

    def _run_warranty_claims(self, actor: Any, args: dict[str, Any], *, hide_amounts: bool) -> dict[str, Any]:
        query = str(args.get("query") or "").strip()
        qs = (
            self.warranty_claim_service.get_queryset_for(actor)
            .filter(owner_id=actor.pk)
            .select_related("asset")
            .order_by("-submitted_date")
        )
        if query:
            qs = qs.filter(asset__name__icontains=query)
        items = list(qs[:AI_TOOL_ITEM_LIMIT])
        return {
            "ok": True,
            "total_count": len(items),
            "items": [
                {
                    "id": str(item.pk),
                    "claim_code": item.claim_code,
                    "asset_name": item.asset.name,
                    "status": item.status,
                    "submitted_date": item.submitted_date.isoformat(),
                    "cost_vnd": self._money(item.cost_vnd, hide_amounts),
                }
                for item in items
            ],
        }

    def _run_stale_projects(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        days = self._int_arg(args.get("days"), 1, 365) or STALE_PROJECT_DAYS
        cutoff = dj_timezone.now() - timedelta(days=days)
        can_pages = self._has_perm(actor, PagePermission.READ.code)
        can_novels = self._has_perm(actor, "novel.novel.read")
        if not can_pages and not can_novels:
            return {"ok": False, "error": "Bạn chưa được cấp quyền xem Trang hoặc Truyện."}
        pages = self.page_service.list_stale_for(actor, cutoff, limit=AI_TOOL_ITEM_LIMIT) if can_pages else []
        novels = (
            self.novel_service.list_stale_for(actor, cutoff, limit=AI_TOOL_ITEM_LIMIT) if can_novels else []
        )
        return {
            "ok": True,
            "stale_days": days,
            "pages": [
                {"id": str(p.pk), "title": p.title, "updated_at": p.updated_at.date().isoformat()}
                for p in pages
            ],
            "novels": [
                {"id": str(n.pk), "title": n.title, "updated_at": n.updated_at.date().isoformat()}
                for n in novels
            ],
        }

    def _run_short_links(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        query = str(args.get("query") or "").strip()
        qs = self.short_link_service.get_queryset_for(actor).filter(owner_id=actor.pk).order_by("-created_at")
        if query:
            qs = qs.filter(slug__icontains=query)
        items = list(qs[:AI_TOOL_ITEM_LIMIT])
        origin = get_frontend_origin(get_current_request(), prefer_configured=True)
        return {
            "ok": True,
            "total_count": len(items),
            "items": [
                {
                    "id": str(item.pk),
                    "slug": item.slug,
                    "short_url": f"{origin}/s/{item.slug}",
                    "name": item.name,
                    "destination_url": item.destination_url,
                    "auto_redirect_seconds": item.auto_redirect_seconds,
                    "has_password": bool(item.password_hash),
                    "status": item.status,
                }
                for item in items
            ],
        }

    def _parse_args(self, raw: Any) -> dict[str, Any]:
        if isinstance(raw, dict):
            return raw
        if isinstance(raw, str) and raw.strip():
            try:
                loaded = json.loads(raw)
                return loaded if isinstance(loaded, dict) else {}
            except ValueError:
                return {}
        return {}

    def _int_arg(self, raw: Any, low: int, high: int) -> int | None:
        if raw is None or raw == "":
            return None
        val = int(raw)
        if val < low or val > high:
            raise ValueError(f"Tham số số phải trong khoảng {low}..{high}.")
        return val

    def _money(self, value: Any, hide_amounts: bool) -> Any:
        if hide_amounts:
            return "*** đ"
        return int(Decimal(str(value or 0)))
