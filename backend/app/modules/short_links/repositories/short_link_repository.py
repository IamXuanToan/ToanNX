"""Repository liên kết rút gọn."""

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.modules.short_links.models.short_link import ShortLink


class ShortLinkRepository(CoreRepository[ShortLink]):
    """Truy cập liên kết chưa xóa mềm."""

    model = ShortLink

    def get_queryset(self) -> QuerySet[ShortLink]:
        """Chỉ liên kết còn tồn tại."""
        return ShortLink.objects.alive()
