"""Nghiệp vụ Nhắc việc cá nhân: lặp định kỳ với `anchor_day` và làm mới lịch W4."""

from datetime import date, timedelta
from typing import Any

from django.db import transaction
from django.utils import timezone

from app.core.services.core_crud_service import CoreCrudService
from app.workspace.constants.workspace_defaults import AI_TOOL_ITEM_LIMIT
from app.workspace.models.reminder import Reminder
from app.workspace.permissions.reminder_permission import ReminderPermission
from app.workspace.repositories.reminder_repository import ReminderRepository
from app.workspace.services.workspace_alerts_cache_service import WorkspaceAlertsCacheService
from app.workspace.services.workspace_setting_service import WorkspaceSettingService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService
from app.workspace.utils.date_math import add_months_clamped
from app.workspace.utils.notification_channels import normalize_workspace_channels


class ReminderService(CoreCrudService[Reminder, ReminderRepository]):
    """Quản lý nhắc việc, tự sinh bản kỳ kế tiếp khi hoàn thành & cập nhật Redis `alerts_next_due`."""

    repository_class = ReminderRepository
    owner_field = "owner"
    manage_all_permission = ReminderPermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: ReminderRepository | None = None,
        alerts_cache_service: WorkspaceAlertsCacheService | None = None,
        setting_service: WorkspaceSettingService | None = None,
        tz_service: WorkspaceTimezoneService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc repository nhắc việc, cấu hình múi giờ và cache W4."""
        super().__init__(repository or ReminderRepository())
        self.alerts_cache_service = alerts_cache_service or WorkspaceAlertsCacheService()
        self.setting_service = setting_service or WorkspaceSettingService()
        self.tz_service = tz_service or WorkspaceTimezoneService()

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> Reminder:
        """Tạo nhắc việc mới, giữ `anchor_day` mặc định theo `due_date.day`."""
        payload = dict(data)
        if not payload.get("anchor_day"):
            payload["anchor_day"] = payload["due_date"].day
        if "notification_channels" in payload:
            payload["notification_channels"] = normalize_workspace_channels(payload["notification_channels"])
        reminder = super().create(actor, payload)
        self.alerts_cache_service.schedule_alerts_next_due_on_commit()
        return reminder

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Reminder:
        """Đánh dấu hoàn thành (`is_completed=True`) → ghi `completed_at` và sinh kỳ lặp tiếp theo."""
        reminder = self.get_for_write(actor, pk)
        payload = dict(data)
        was_completed = reminder.is_completed
        target_completed = bool(payload.get("is_completed", was_completed))

        if "is_completed" in payload:
            if target_completed and not was_completed:
                payload["completed_at"] = timezone.now()
            elif not target_completed and was_completed:
                payload["completed_at"] = None

        if "notification_channels" in payload:
            payload["notification_channels"] = normalize_workspace_channels(payload["notification_channels"])

        updated = self.repository.update(reminder, actor=actor, **payload)

        if not was_completed and target_completed and updated.recurrence != Reminder.Recurrence.NONE:
            next_due = self._next_due_date(
                updated.due_date,
                updated.recurrence,
                updated.anchor_day or updated.due_date.day,
            )
            self.repository.create(
                actor=actor,
                owner=updated.owner,
                title=updated.title,
                description=updated.description,
                due_date=next_due,
                due_time=updated.due_time,
                notify_minutes_before=updated.notify_minutes_before,
                priority=updated.priority,
                is_completed=False,
                recurrence=updated.recurrence,
                anchor_day=updated.anchor_day or updated.due_date.day,
                tags=list(updated.tags or []),
                notification_channels=normalize_workspace_channels(updated.notification_channels),
            )

        self.alerts_cache_service.schedule_alerts_next_due_on_commit()
        return updated

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Xóa mềm nhắc việc và tính lại `alerts_next_due`."""
        super().delete(actor, pk)
        self.alerts_cache_service.schedule_alerts_next_due_on_commit()

    def get_pending(self, actor: Any, *, scope: str = "today") -> tuple[list[Reminder], int]:
        """Lấy danh sách việc chưa xong của `actor` (`overdue`/`today`/`week`/`all`)."""
        setting = self.setting_service.get_or_create_for_owner(actor)
        today_local = self.tz_service.local_today(setting.timezone)
        if scope == "overdue":
            return self.repository.list_pending_between(
                actor.pk, end_date=today_local - timedelta(days=1), limit=AI_TOOL_ITEM_LIMIT
            )
        if scope == "today":
            return self.repository.list_pending_between(
                actor.pk, start_date=today_local, end_date=today_local, limit=AI_TOOL_ITEM_LIMIT
            )
        if scope == "week":
            return self.repository.list_pending_between(
                actor.pk,
                start_date=today_local,
                end_date=today_local + timedelta(days=7),
                limit=AI_TOOL_ITEM_LIMIT,
            )
        return self.repository.list_pending_between(actor.pk, limit=AI_TOOL_ITEM_LIMIT)

    def _next_due_date(self, current_due: date, recurrence: str, anchor_day: int) -> date:
        if recurrence == Reminder.Recurrence.DAILY:
            return current_due + timedelta(days=1)
        if recurrence == Reminder.Recurrence.WEEKLY:
            return current_due + timedelta(days=7)
        if recurrence == Reminder.Recurrence.MONTHLY:
            return add_months_clamped(current_due, 1, anchor_day=anchor_day)
        if recurrence == Reminder.Recurrence.YEARLY:
            return add_months_clamped(current_due, 12, anchor_day=anchor_day)
        return current_due
