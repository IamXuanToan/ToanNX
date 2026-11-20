"""Repository liên kết rút gọn."""

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.utilities.models.short_link import ShortLink


class ShortLinkRepository(CoreRepository[ShortLink]):
    """Truy cập liên kết chưa xóa mềm."""

    model = ShortLink

    def get_queryset(self) -> QuerySet[ShortLink]:
        """Chỉ liên kết còn tồn tại, kèm owner cho danh sách (không N+1)."""
        return super().get_queryset().select_related("owner")
