"""Nghiệp vụ Nhắc việc cá nhân: lặp định kỳ và làm mới lịch W4."""

from datetime import date, timedelta
from typing import Any

from django.db import transaction
from django.utils import timezone

from app.core.constants.defaults import DEFAULT_TIMEZONE
from app.core.exceptions.validation_error import ValidationError
from app.core.services.core_crud_service import CoreCrudService
from app.workspace.constants.workspace_defaults import AI_TOOL_ITEM_LIMIT
from app.workspace.models.reminder import Reminder
from app.workspace.permissions.reminder_permission import ReminderPermission
from app.workspace.repositories.reminder_repository import ReminderRepository
from app.workspace.repositories.reminder_topic_repository import ReminderTopicRepository
from app.workspace.services.workspace_alerts_cache_service import WorkspaceAlertsCacheService
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService
from app.workspace.utils.date_math import add_months_clamped


class ReminderService(CoreCrudService[Reminder, ReminderRepository]):
    """Quản lý nhắc việc, tự sinh bản kỳ kế tiếp khi hoàn thành & cập nhật Redis `alerts_next_due`."""

    repository_class = ReminderRepository
    owner_field = "owner"
    manage_all_permission = ReminderPermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: ReminderRepository | None = None,
        topic_repository: ReminderTopicRepository | None = None,
        alerts_cache_service: WorkspaceAlertsCacheService | None = None,
        tz_service: WorkspaceTimezoneService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc repository nhắc việc, chủ đề, dịch vụ múi giờ và cache W4."""
        super().__init__(repository or ReminderRepository())
        self.topic_repository = topic_repository or ReminderTopicRepository()
        self.alerts_cache_service = alerts_cache_service or WorkspaceAlertsCacheService()
        self.tz_service = tz_service or WorkspaceTimezoneService()

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> Reminder:
        """Tạo nhắc việc mới."""
        payload = dict(data)
        self._resolve_topic(actor, payload)
        if "reminder_days_before" in payload:
            payload["reminder_days_before"] = self._normalize_days_before(payload["reminder_days_before"])
        reminder = super().create(actor, payload)
        self.alerts_cache_service.schedule_alerts_next_due_on_commit()
        return reminder

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Reminder:
        """Đánh dấu hoàn thành (`is_completed=True`) → ghi `completed_at` và sinh kỳ lặp tiếp theo."""
        reminder = self.get_for_write(actor, pk)
        payload = dict(data)
        self._resolve_topic(reminder.owner, payload)
        was_completed = reminder.is_completed
        target_completed = bool(payload.get("is_completed", was_completed))

        if "is_completed" in payload:
            if target_completed and not was_completed:
                payload["completed_at"] = timezone.now()
            elif not target_completed and was_completed:
                payload["completed_at"] = None

        if "reminder_days_before" in payload:
            payload["reminder_days_before"] = self._normalize_days_before(payload["reminder_days_before"])

        updated = self.repository.update(reminder, actor=actor, **payload)

        if not was_completed and target_completed and updated.recurrence != Reminder.Recurrence.NONE:
            next_due = self._next_due_date(updated.due_date, updated.recurrence)
            self.repository.create(
                actor=actor,
                owner=updated.owner,
                title=updated.title,
                description=updated.description,
                due_date=next_due,
                due_time=updated.due_time,
                notify_minutes_before=updated.notify_minutes_before,
                reminder_days_before=list(updated.reminder_days_before or []),
                priority=updated.priority,
                is_completed=False,
                recurrence=updated.recurrence,
                topic=updated.topic,
            )

        self.alerts_cache_service.schedule_alerts_next_due_on_commit()
        return updated

    def _resolve_topic(self, owner: Any, payload: dict[str, Any]) -> None:
        """Kiểm tra `topic_id` thuộc hệ thống hoặc thuộc chính `owner`."""
        if "topic_id" not in payload:
            return
        topic_id = payload.pop("topic_id")
        if topic_id is None:
            payload["topic"] = None
            return
        topic = self.topic_repository.find_usable_for_actor(owner.pk, topic_id)
        if topic is None:
            raise ValidationError(details={"topic_id": ["Chủ đề không tồn tại hoặc không thuộc quyền dùng."]})
        payload["topic"] = topic

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Xóa mềm nhắc việc và tính lại `alerts_next_due`."""
        super().delete(actor, pk)
        self.alerts_cache_service.schedule_alerts_next_due_on_commit()

    def get_pending(self, actor: Any, *, scope: str = "today") -> tuple[list[Reminder], int]:
        """Lấy danh sách việc chưa xong của `actor` (`overdue`/`today`/`week`/`all`)."""
        today_local = self.tz_service.local_today(DEFAULT_TIMEZONE)
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

    def _next_due_date(self, current_due: date, recurrence: str) -> date:
        if recurrence == Reminder.Recurrence.DAILY:
            return current_due + timedelta(days=1)
        if recurrence == Reminder.Recurrence.WEEKLY:
            return current_due + timedelta(days=7)
        if recurrence == Reminder.Recurrence.MONTHLY:
            return add_months_clamped(current_due, 1)
        if recurrence == Reminder.Recurrence.YEARLY:
            return add_months_clamped(current_due, 12)
        return current_due

    @staticmethod
    def _normalize_days_before(raw_days: Any) -> list[int]:
        if not isinstance(raw_days, list):
            return []
        unique: set[int] = set()
        for item in raw_days:
            val = int(item)
            if 1 <= val <= 365:
                unique.add(val)
        return sorted(unique, reverse=True)
