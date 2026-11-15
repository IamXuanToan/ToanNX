"""Recorder thật cho `JournalTracker`: lưu `ChangeSet` vào `journal_entry`."""

from typing import Any

from django.contrib.auth import get_user_model
from django.db.models import QuerySet

from app.core.context.user_context import get_current_user, get_request_id
from app.core.tracking.change_recorder import ChangeRecorder
from app.core.tracking.change_set import ChangeSet
from app.modules.journal.models.journal_entry import JournalEntry
from app.modules.journal.repositories.journal_entry_repository import JournalEntryRepository


class JournalRecorder(ChangeRecorder):
    """Cấu hình qua `CORE_CHANGE_RECORDER`. Ghi trong cùng transaction với thay đổi."""

    def __init__(self) -> None:
        """Khởi tạo repository."""
        self.repository = JournalEntryRepository()

    def record(self, change: ChangeSet) -> None:
        """Lưu một thay đổi.

        Args:
            change: Thay đổi do tracker phát ra.
        """
        self.repository.insert(
            actor_id=change.actor_id,
            actor_label=self._actor_label(change.actor_id),
            request_id=get_request_id() or "",
            resource=change.resource,
            object_id=change.object_id,
            object_label=change.object_label,
            action=change.action,
            event=change.event,
            changes=change.changes,
        )

    def history(self, resource: str, object_id: Any) -> QuerySet[JournalEntry]:
        """Lịch sử của một bản ghi.

        Args:
            resource: `<module>.<model>`.
            object_id: Id bản ghi.

        Returns:
            QuerySet mới nhất trước.
        """
        return self.repository.for_object(resource, object_id)

    @staticmethod
    def _actor_label(actor_id: Any) -> str:
        """Email người thực hiện; dùng người dùng của request nếu khớp để không tốn query."""
        if actor_id is None:
            return ""
        current = get_current_user()
        if current is not None and str(current.pk) == str(actor_id):
            return str(current.email)
        email = get_user_model()._default_manager.filter(pk=actor_id).values_list("email", flat=True).first()
        return str(email or "")
