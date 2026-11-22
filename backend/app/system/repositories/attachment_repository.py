"""Repository file đính kèm (đọc + ghi)."""

from typing import Any

from django.db.models import QuerySet, Sum

from app.core.repositories.core_repository import CoreRepository
from app.system.models.attachment import Attachment


class AttachmentRepository(CoreRepository[Attachment]):
    """Truy cập dữ liệu Attachment."""

    model = Attachment

    def get_total_alive_size(self) -> int:
        """Tổng dung lượng (bytes) của các tệp chưa bị xóa mềm trong hệ thống.

        Returns:
            Số bytes nguyên.
        """
        return self.get_queryset().aggregate(total=Sum("size"))["total"] or 0

    def get_total_storage_size(self, visibility: str | None = None) -> int:
        """Tổng dung lượng (bytes) của các tệp vật lý chưa bị dọn khỏi storage (purged_at IS NULL).

        Bao gồm cả các bản ghi đã xóa mềm nhưng chưa dọn dẹp vật lý trên R2/Storage.

        Args:
            visibility: Chỉ tính một kho (`public`/`private`); None là cả hai.

        Returns:
            Số bytes nguyên.
        """
        rows = self.get_queryset_with_deleted().filter(purged_at__isnull=True)
        if visibility is not None:
            rows = rows.filter(visibility=visibility)
        return rows.aggregate(total=Sum("size"))["total"] or 0

    def purgeable_files(self, before: Any, limit: int) -> list[tuple[Any, str, str]]:
        """File của bản ghi đã xóa mềm trước mốc và chưa dọn.

        Args:
            before: Mốc thời gian.
            limit: Số bản ghi tối đa mỗi lần.

        Returns:
            `[(id, đường dẫn file, chế độ xem)]` (chế độ xem quyết định kho chứa file).
        """
        rows = (
            self.get_queryset_with_deleted()
            .filter(deleted_at__lt=before, purged_at__isnull=True)
            .order_by("deleted_at")[:limit]
        )
        return list(rows.values_list("pk", "file", "visibility"))

    def mark_purged(self, ids: list[Any], when: Any) -> int:
        """Đánh dấu file vật lý đã bị dọn (giữ dòng dữ liệu cho khóa ngoại và lịch sử).

        Args:
            ids: Id bản ghi.
            when: Thời điểm dọn.

        Returns:
            Số bản ghi đã đánh dấu.
        """
        return self.get_queryset_with_deleted().filter(pk__in=ids).update(purged_at=when)

    def referenced_file_names(self, visibility: str) -> set[str]:
        """Đường dẫn file trong một kho mà bản ghi chưa dọn còn trỏ tới (kể cả đã xóa mềm, chưa quá hạn).

        Args:
            visibility: Kho (`public`/`private`).

        Returns:
            Tập đường dẫn trong kho đó.
        """
        return set(
            self.get_queryset_with_deleted()
            .filter(purged_at__isnull=True, visibility=visibility)
            .values_list("file", flat=True)
        )

    def get_queryset(self) -> QuerySet[Attachment]:
        """File chưa xóa mềm.

        Returns:
            QuerySet.
        """
        return super().get_queryset().select_related("created_by", "folder")
