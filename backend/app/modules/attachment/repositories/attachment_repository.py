"""Repository file đính kèm (đọc + ghi)."""

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.modules.attachment.models.attachment import Attachment


class AttachmentRepository(CoreRepository[Attachment]):
    """Truy cập dữ liệu Attachment."""

    model = Attachment

    def get_queryset(self) -> QuerySet[Attachment]:
        """File chưa xóa mềm.

        Returns:
            QuerySet.
        """
        return super().get_queryset().select_related("created_by", "folder")
