"""Recorder thật cho `JournalTracker`: lưu `ChangeSet` vào `journal_entry`."""

from typing import Any

from django.db.models import QuerySet

from app.core.context.user_context import get_current_user, get_request_id
from app.core.tracking.change_recorder import ChangeRecorder
from app.core.tracking.change_set import ChangeSet
from app.system.models.journal_entry import JournalEntry
from app.system.repositories.journal_entry_repository import JournalEntryRepository
from app.system.repositories.user_repository import UserRepository


class JournalRecorder(ChangeRecorder):
    """Cấu hình qua `CORE_CHANGE_RECORDER`. Ghi trong cùng transaction với thay đổi."""

    def __init__(self) -> None:
        """Khởi tạo repository."""
        self.repository = JournalEntryRepository()
        self.user_repository = UserRepository()

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

    def _actor_label(self, actor_id: Any) -> str:
        """Email người thực hiện; dùng người dùng của request nếu khớp để không tốn query."""
        if actor_id is None:
            return ""
        current = get_current_user()
        if current is not None and str(current.pk) == str(actor_id):
            return str(current.email)
        return self.user_repository.find_email_by_id(actor_id)
