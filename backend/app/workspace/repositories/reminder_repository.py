"""Repository Nhắc việc cá nhân."""

from datetime import date
from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.workspace.models.reminder import Reminder


class ReminderRepository(CoreRepository[Reminder]):
    """Truy xuất công việc và nhắc hẹn."""

    model = Reminder

    def get_queryset(self) -> QuerySet[Reminder]:
        """Nạp trước owner."""
        return super().get_queryset().select_related("owner")

    def list_pending_between(
        self, owner_id: Any, *, start_date: date | None = None, end_date: date | None = None, limit: int = 15
    ) -> tuple[list[Reminder], int]:
        """Việc chưa hoàn thành trong khoảng ngày cho Dashboard/AI Tool."""
        qs = self.get_queryset().filter(owner_id=owner_id, is_completed=False)
        if start_date is not None:
            qs = qs.filter(due_date__gte=start_date)
        if end_date is not None:
            qs = qs.filter(due_date__lte=end_date)
        qs = qs.order_by("due_date", "due_time", "created_at")
        return list(qs[:limit]), qs.count()

    def list_between(self, owner_id: Any, start_date: date, end_date: date) -> list[Reminder]:
        """Mọi nhắc việc trong khoảng ngày (cho Calendar)."""
        return list(
            self.get_queryset()
            .filter(owner_id=owner_id, due_date__gte=start_date, due_date__lte=end_date)
            .order_by("due_date", "due_time")
        )

    def list_all_pending_up_to(self, end_date: date, *, start_date: date | None = None) -> list[Reminder]:
        """Mọi nhắc việc chưa xong trong khoảng `due_date <= end_date` (có cận dưới khi cron quét)."""
        qs = self.get_queryset().filter(is_completed=False, due_date__lte=end_date)
        if start_date is not None:
            qs = qs.filter(due_date__gte=start_date)
        return list(qs.order_by("due_date", "due_time"))
