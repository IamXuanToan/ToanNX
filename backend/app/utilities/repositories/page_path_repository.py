"""Repository đường dẫn giữa."""

from typing import Any

from django.db.models import Count, Q, QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.utilities.models.page_path import PagePath


class PagePathRepository(CoreRepository[PagePath]):
    """Đường dẫn giữa chưa xóa, kèm số trang còn tồn tại."""

    model = PagePath

    def get_queryset(self) -> QuerySet[PagePath]:
        """Chưa xóa mềm, annotate `page_count`."""
        return (
            super()
            .get_queryset()
            .annotate(page_count=Count("pages", filter=Q(pages__deleted_at__isnull=True)))
        )

    def has_pages(self, path_id: Any) -> bool:
        """Đường dẫn còn trang (kể cả trang đã xóa mềm, vì FK PROTECT và URL không dùng lại).

        Args:
            path_id: Id đường dẫn.

        Returns:
            True nếu còn trang tham chiếu.
        """
        return PagePath.objects.filter(pk=path_id, pages__isnull=False).exists()
