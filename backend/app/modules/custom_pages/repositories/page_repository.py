"""Repository trang tùy chỉnh."""

from django.db.models import Prefetch, QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.modules.custom_pages.models.page import Page
from app.modules.custom_pages.models.page_block import PageBlock


class PageRepository(CoreRepository[Page]):
    """Truy cập trang chưa xóa mềm."""

    model = Page

    def get_queryset(self) -> QuerySet[Page]:
        """Trang còn tồn tại, ảnh đã nạp để response không gây N+1."""
        return (
            Page.objects.alive()
            .select_related("avatar", "cover")
            .prefetch_related(Prefetch("blocks", queryset=PageBlock.objects.alive().order_by("position")))
        )
