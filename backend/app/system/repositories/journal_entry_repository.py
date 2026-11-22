"""Repository nhật ký thay đổi (chỉ thêm và đọc)."""

from datetime import datetime
from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.system.models.journal_entry import JournalEntry


class JournalEntryRepository(CoreRepository[JournalEntry]):
    """Truy cập `journal_entry`."""

    model = JournalEntry

    def get_queryset(self) -> QuerySet[JournalEntry]:
        """Mới nhất trước."""
        return JournalEntry.objects.order_by("-created_at", "-pk")

    def for_object(self, resource: str, object_id: Any) -> QuerySet[JournalEntry]:
        """Lịch sử của một bản ghi (dùng index `journal_object_idx`).

        Args:
            resource: `<module>.<model>`.
            object_id: Id bản ghi.

        Returns:
            QuerySet mới nhất trước.
        """
        return self.get_queryset().filter(resource=resource, object_id=str(object_id))

    def insert(self, **fields: Any) -> JournalEntry:
        """Thêm một mục (bảng không có audit nên không qua `create`).

        Args:
            **fields: Giá trị field.

        Returns:
            Mục đã lưu.
        """
        return JournalEntry.objects.create(**fields)

    def delete_before(self, moment: datetime) -> int:
        """Xóa mục cũ hơn mốc (dọn theo `JOURNAL_RETENTION_DAYS`).

        Args:
            moment: Mốc thời gian.

        Returns:
            Số mục đã xóa.
        """
        return self.hard_delete_where(created_at__lt=moment)
