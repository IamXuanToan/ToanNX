"""8 Agentic Tools của Trợ lý AI: allowlist chặt chẽ, luôn lọc `owner_id=actor.pk`, 0 tool VaultItem."""

import json
from datetime import date, time, timedelta
from decimal import Decimal
from typing import Any

from django.utils import timezone as dj_timezone

from app.core.exceptions.app_exception import AppException
from app.finance.services.finance_report_service import FinanceReportService
from app.novel.services.novel_service import NovelService
from app.utilities.services.page_service import PageService
from app.workspace.constants.workspace_defaults import AI_TOOL_ITEM_LIMIT, STALE_PROJECT_DAYS
from app.workspace.models.asset import Asset
from app.workspace.models.reminder import Reminder
from app.workspace.services.asset_service import AssetService
from app.workspace.services.reminder_service import ReminderService
from app.workspace.services.subscription_service import SubscriptionService
from app.workspace.services.workspace_setting_service import WorkspaceSettingService
from app.workspace.services.workspace_spending_service import WorkspaceSpendingService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService

READ_TOOL_NAMES = frozenset(
    {
        "get_spending_summary",
        "get_finance_income_summary",
        "get_upcoming_subscriptions",
        "get_pending_reminders",
        "get_assets_and_warranty",
        "get_stale_projects",
    }
)
OWNER_MUTATION_TOOL_NAMES = frozenset({"create_quick_reminder"})
ALL_TOOL_NAMES = READ_TOOL_NAMES | OWNER_MUTATION_TOOL_NAMES


class AssistantToolsService:
    """Thực thi 7 tool cá nhân an toàn; tuyệt đối không có tool đọc/giải mã Két sắt Bí mật."""

    def __init__(
        self,
        spending_service: WorkspaceSpendingService | None = None,
        finance_report_service: FinanceReportService | None = None,
        subscription_service: SubscriptionService | None = None,
        reminder_service: ReminderService | None = None,
        asset_service: AssetService | None = None,
        page_service: PageService | None = None,
        novel_service: NovelService | None = None,
        setting_service: WorkspaceSettingService | None = None,
        tz_service: WorkspaceTimezoneService | None = None,
    ) -> None:
        """Khởi tạo toàn bộ service nghiệp vụ được phép gọi từ Trợ lý AI."""
        self.spending_service = spending_service or WorkspaceSpendingService()
        self.finance_report_service = finance_report_service or FinanceReportService()
        self.subscription_service = subscription_service or SubscriptionService()
        self.reminder_service = reminder_service or ReminderService()
        self.asset_service = asset_service or AssetService()
        self.page_service = page_service or PageService()
        self.novel_service = novel_service or NovelService()
        self.setting_service = setting_service or WorkspaceSettingService()
        self.tz_service = tz_service or WorkspaceTimezoneService()

    def tool_schemas(self, *, is_owner: bool = True) -> list[dict[str, Any]]:
        """Danh sách schema JSON OpenAI function calling (lược bớt tool ghi nếu không phải chính chủ)."""
        schemas: list[dict[str, Any]] = [
            self._schema(
                "get_spending_summary",
                (
                    "Xem tổng hợp chi tiêu cá nhân trong tháng "
                    "(gia hạn dịch vụ, mua thiết bị, sửa chữa, dự kiến)."
                ),
                {
                    "month": {"type": "integer", "minimum": 1, "maximum": 12},
                    "year": {"type": "integer", "minimum": 2020, "maximum": 2100},
                },
            ),
            self._schema(
                "get_finance_income_summary",
                "Xem thu nhập theo tháng/năm từ module Tài chính cá nhân (lọc tùy chọn theo tên nền tảng).",
                {
                    "month": {"type": "integer", "minimum": 1, "maximum": 12},
                    "year": {"type": "integer", "minimum": 2020, "maximum": 2100},
                    "platform_name": {"type": "string", "maxLength": 100},
                },
            ),
            self._schema(
                "get_upcoming_subscriptions",
                "Xem các dịch vụ định kỳ (domain, VPS, SaaS) sắp gia hạn trong N ngày tới.",
                {"days_ahead": {"type": "integer", "minimum": 1, "maximum": 90}},
            ),
            self._schema(
                "get_pending_reminders",
                "Xem nhắc việc chưa hoàn thành theo phạm vi (`today`, `overdue`, `week`, `all`).",
                {"scope": {"type": "string", "enum": ["today", "overdue", "week", "all"]}},
            ),
            self._schema(
                "get_assets_and_warranty",
                "Tra cứu danh sách thiết bị, nơi mua và thời hạn bảo hành cá nhân.",
                {
                    "query": {"type": "string", "maxLength": 100},
                    "status": {"type": "string", "enum": [c[0] for c in Asset.Status.choices]},
                },
            ),
            self._schema(
                "get_stale_projects",
                "Tìm các trang tùy chỉnh hoặc truyện của chính chủ bị bỏ quên chưa cập nhật.",
                {"days": {"type": "integer", "minimum": 1, "maximum": 365}},
            ),
        ]
        if is_owner:
            schemas.append(
                self._schema(
                    "create_quick_reminder",
                    "Tạo nhắc việc cá nhân mới cho chính chủ.",
                    {
                        "title": {"type": "string", "minLength": 1, "maxLength": 200},
                        "due_date": {"type": "string", "description": "YYYY-MM-DD"},
                        "due_time": {"type": "string", "description": "HH:MM tùy chọn"},
                        "priority": {
                            "type": "string",
                            "enum": [c[0] for c in Reminder.Priority.choices],
                        },
                    },
                    required=["title", "due_date"],
                )
            )
        return schemas

    def execute_tool(
        self,
        actor: Any,
        name: str,
        raw_arguments: Any,
        *,
        is_owner: bool = True,
        hide_amounts: bool = False,
    ) -> dict[str, Any]:
        """Kiểm allowlist, ép lọc `owner_id=actor.pk` và trả JSON tối giản tối đa 15 dòng."""
        if name not in ALL_TOOL_NAMES:
            return {"ok": False, "error": f"Tool '{name}' không nằm trong danh sách cho phép."}
        if name in OWNER_MUTATION_TOOL_NAMES and not is_owner:
            return {"ok": False, "error": "Chỉ chủ sở hữu mới có quyền tạo dữ liệu."}

        args = self._parse_args(raw_arguments)
        try:
            if name == "get_spending_summary":
                return self._run_spending(actor, args, hide_amounts=hide_amounts)
            if name == "get_finance_income_summary":
                return self._run_finance_income(actor, args, hide_amounts=hide_amounts)
            if name == "get_upcoming_subscriptions":
                return self._run_subscriptions(actor, args, hide_amounts=hide_amounts)
            if name == "get_pending_reminders":
                return self._run_reminders(actor, args)
            if name == "get_assets_and_warranty":
                return self._run_assets(actor, args, hide_amounts=hide_amounts)
            if name == "get_stale_projects":
                return self._run_stale_projects(actor, args)
            return self._run_create_reminder(actor, args)
        except (AppException, ValueError, TypeError) as exc:
            return {"ok": False, "error": str(exc)}

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
        setting = self.setting_service.get_or_create_for_owner(actor)
        today_local = self.tz_service.local_today(setting.timezone)
        year = self._int_arg(args.get("year"), 2020, 2100) or today_local.year
        month = self._int_arg(args.get("month"), 1, 12) if args.get("month") is not None else None
        platform_filter = str(args.get("platform_name") or "").strip().lower()

        report = self.finance_report_service.summary(actor, year, month, owner_ids=[actor.pk])
        platforms = report.get("by_platform") or []
        if platform_filter:
            platforms = [
                row for row in platforms if platform_filter in str(row.get("platform") or "").lower()
            ]
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
        items, total = self.reminder_service.get_pending(actor, scope=scope)
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
                    "priority": item.priority,
                }
                for item in items
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

    def _run_stale_projects(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        days = self._int_arg(args.get("days"), 1, 365) or STALE_PROJECT_DAYS
        cutoff = dj_timezone.now() - timedelta(days=days)
        pages = self.page_service.list_stale_for(actor, cutoff, limit=AI_TOOL_ITEM_LIMIT)
        novels = self.novel_service.list_stale_for(actor, cutoff, limit=AI_TOOL_ITEM_LIMIT)
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

    def _run_create_reminder(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        title = str(args.get("title") or "").strip()
        if not title:
            return {"ok": False, "error": "Tiêu đề nhắc việc không được trống."}
        due_date_raw = str(args.get("due_date") or "").strip()
        due_date_val = date.fromisoformat(due_date_raw)
        due_time_val: time | None = None
        if args.get("due_time"):
            parsed = self.tz_service.parse_hhmm(str(args["due_time"]))
            if parsed is None:
                return {"ok": False, "error": "Giờ đến hạn phải đúng dạng HH:MM."}
            due_time_val = parsed
        priority = str(args.get("priority") or Reminder.Priority.MEDIUM).strip()
        if priority not in {c[0] for c in Reminder.Priority.choices}:
            priority = Reminder.Priority.MEDIUM

        created = self.reminder_service.create(
            actor,
            {
                "title": title[:255],
                "due_date": due_date_val,
                "due_time": due_time_val,
                "priority": priority,
            },
        )
        return {
            "ok": True,
            "created": {
                "id": str(created.pk),
                "title": created.title,
                "due_date": created.due_date.isoformat(),
                "due_time": created.due_time.strftime("%H:%M") if created.due_time else "",
                "priority": created.priority,
            },
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

    def _schema(
        self,
        name: str,
        description: str,
        properties: dict[str, Any],
        *,
        required: list[str] | None = None,
    ) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": name,
                "description": description,
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    **({"required": required} if required else {}),
                },
            },
        }
