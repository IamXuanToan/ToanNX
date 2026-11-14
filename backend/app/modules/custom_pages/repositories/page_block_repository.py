"""Repository block của trang."""

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.modules.custom_pages.models.page_block import PageBlock


class PageBlockRepository(CoreRepository[PageBlock]):
    """Truy cập block chưa xóa mềm."""

    model = PageBlock

    def get_queryset(self) -> QuerySet[PageBlock]:
        """Block chưa bị xóa, theo thứ tự trang."""
        return PageBlock.objects.alive().order_by("position")
