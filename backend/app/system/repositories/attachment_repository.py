"""Repository file đính kèm (đọc + ghi)."""

from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.system.models.attachment import Attachment


class AttachmentRepository(CoreRepository[Attachment]):
    """Truy cập dữ liệu Attachment."""

    model = Attachment

    def purgeable_files(self, before: Any, limit: int) -> list[tuple[Any, str]]:
        """File của bản ghi đã xóa mềm trước mốc và chưa dọn.

        Args:
            before: Mốc thời gian.
            limit: Số bản ghi tối đa mỗi lần.

        Returns:
            `[(id, đường dẫn file)]`.
        """
        rows = (
            self.get_queryset_with_deleted()
            .filter(deleted_at__lt=before, purged_at__isnull=True)
            .order_by("deleted_at")[:limit]
        )
        return list(rows.values_list("pk", "file"))

    def mark_purged(self, ids: list[Any], when: Any) -> int:
        """Đánh dấu file vật lý đã bị dọn (giữ dòng dữ liệu cho khóa ngoại và lịch sử).

        Args:
            ids: Id bản ghi.
            when: Thời điểm dọn.

        Returns:
            Số bản ghi đã đánh dấu.
        """
        return self.get_queryset_with_deleted().filter(pk__in=ids).update(purged_at=when)

    def referenced_file_names(self) -> set[str]:
        """Đường dẫn file mà bản ghi chưa dọn còn trỏ tới (kể cả đã xóa mềm, chưa quá hạn).

        Returns:
            Tập đường dẫn trong storage.
        """
        return set(
            self.get_queryset_with_deleted().filter(purged_at__isnull=True).values_list("file", flat=True)
        )

    def get_queryset(self) -> QuerySet[Attachment]:
        """File chưa xóa mềm.

        Returns:
            QuerySet.
        """
        return super().get_queryset().select_related("created_by", "folder")
