"""Nghiệp vụ Bảng điều khiển Tổng hợp Portal (4 KPI chính + danh sách việc gần nhất)."""

from datetime import timedelta
from decimal import Decimal
from typing import Any

from app.system.services.user_service import UserService
from app.workspace.permissions.workspace_dashboard_permission import WorkspaceDashboardPermission
from app.workspace.repositories.asset_repository import AssetRepository
from app.workspace.repositories.monitor_target_repository import MonitorTargetRepository
from app.workspace.repositories.reminder_repository import ReminderRepository
from app.workspace.repositories.subscription_repository import SubscriptionRepository
from app.workspace.services.monitor_target_service import MonitorTargetService
from app.workspace.services.workspace_setting_service import WorkspaceSettingService
from app.workspace.services.workspace_spending_service import WorkspaceSpendingService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService


class WorkspaceDashboardService:
    """Tổng hợp số liệu nhanh cho Client Portal Dashboard."""

    def __init__(
        self,
        spending_service: WorkspaceSpendingService | None = None,
        setting_service: WorkspaceSettingService | None = None,
        tz_service: WorkspaceTimezoneService | None = None,
        user_service: UserService | None = None,
        asset_repository: AssetRepository | None = None,
        subscription_repository: SubscriptionRepository | None = None,
        reminder_repository: ReminderRepository | None = None,
        monitor_repository: MonitorTargetRepository | None = None,
        monitor_service: MonitorTargetService | None = None,
    ) -> None:
        """Khởi tạo các service và repository phục vụ KPI dashboard."""
        self.spending_service = spending_service or WorkspaceSpendingService()
        self.setting_service = setting_service or WorkspaceSettingService()
        self.tz_service = tz_service or WorkspaceTimezoneService()
        self.user_service = user_service or UserService()
        self.asset_repository = asset_repository or AssetRepository()
        self.subscription_repository = subscription_repository or SubscriptionRepository()
        self.reminder_repository = reminder_repository or ReminderRepository()
        self.monitor_repository = monitor_repository or MonitorTargetRepository()
        self.monitor_service = monitor_service or MonitorTargetService()

    def summary(self, actor: Any, *, target_owner_id: Any | None = None) -> dict[str, Any]:
        """Trả 4 nhóm KPI theo đúng chủ sở hữu (chỉ xem user khác nếu có `manage_all`)."""
        target_owner = actor
        if (
            target_owner_id
            and str(target_owner_id) != str(actor.pk)
            and actor.has_perm(WorkspaceDashboardPermission.MANAGE_ALL.code)
        ):
            _, _ = self.setting_service.get_for_target_owner(target_owner_id)
            target_owner = self.user_service.find_by_id(target_owner_id) or actor

        setting = self.setting_service.get_or_create_for_owner(target_owner)
        today_local = self.tz_service.local_today(setting.timezone)

        spending = self.spending_service.summary(actor, owner=target_owner)

        today_reminders, today_count = self.reminder_repository.list_pending_between(
            target_owner.pk,
            start_date=today_local,
            end_date=today_local,
            limit=5,
        )
        _, overdue_count = self.reminder_repository.list_pending_between(
            target_owner.pk,
            end_date=today_local - timedelta(days=1),
            limit=1,
        )

        expiring_warranties = self.asset_repository.count_expiring_before(
            target_owner.pk,
            today_local,
            today_local + timedelta(days=30),
        )
        upcoming_subs, upcoming_sub_count = self.subscription_repository.list_upcoming_for_owner(
            target_owner.pk,
            today_local,
            today_local + timedelta(days=14),
        )
        upcoming_sub_total = sum((Decimal(item.amount_vnd) for item in upcoming_subs), Decimal("0"))

        monitor_items, monitors_total = self.monitor_repository.list_for_owner(target_owner.pk, limit=200)
        monitors_healthy = 0
        monitors_down = 0
        for item in monitor_items:
            overlaid = self.monitor_service.overlay_redis_state(item)
            if overlaid.last_status == "HEALTHY":
                monitors_healthy += 1
            elif overlaid.last_status == "DOWN":
                monitors_down += 1

        return {
            "owner_id": str(target_owner.pk),
            "timezone": setting.timezone,
            "today": today_local,
            "monthly_spending_vnd": spending["total_spent_vnd"],
            "subscription_paid_vnd": spending["subscription_paid_vnd"],
            "asset_purchase_vnd": spending["asset_purchase_vnd"],
            "warranty_repair_vnd": spending["warranty_repair_vnd"],
            "projected_subscriptions_vnd": spending["projected_subscriptions_vnd"],
            "pending_reminders_today": today_count,
            "overdue_reminders": overdue_count,
            "expiring_warranties_30d": expiring_warranties,
            "upcoming_subscriptions_14d": upcoming_sub_count,
            "upcoming_subscriptions_14d_vnd": upcoming_sub_total,
            "monitors_total": monitors_total,
            "monitors_healthy": monitors_healthy,
            "monitors_down": monitors_down,
            "today_reminders": [
                {
                    "id": str(item.pk),
                    "title": item.title,
                    "due_date": item.due_date,
                    "due_time": item.due_time.strftime("%H:%M") if item.due_time else "",
                    "priority": item.priority,
                    "is_completed": item.is_completed,
                }
                for item in today_reminders
            ],
        }
