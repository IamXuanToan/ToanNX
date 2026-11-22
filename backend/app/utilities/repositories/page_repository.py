"""Repository trang tùy chỉnh."""

from django.db.models import QuerySet
from django.db.models.functions import Lower

from app.core.repositories.core_repository import CoreRepository
from app.utilities.models.page import Page


class PageRepository(CoreRepository[Page]):
    """Truy cập trang chưa xóa mềm (kèm đường dẫn giữa, owner, ảnh — không N+1)."""

    model = Page

    def get_queryset(self) -> QuerySet[Page]:
        """Trang còn tồn tại."""
        return super().get_queryset().select_related("path", "owner", "avatar", "cover")

    def find_by_url(self, segment: str, slug: str) -> Page | None:
        """Trang theo URL công khai `/<segment>/<slug>` (không phân biệt hoa thường).

        Args:
            segment: Đoạn đường dẫn giữa.
            slug: Slug trang.

        Returns:
            Trang hoặc None.
        """
        return (
            self.get_queryset()
            .annotate(segment_ci=Lower("path__segment"), slug_ci=Lower("slug"))
            .filter(segment_ci=segment.lower(), slug_ci=slug.lower(), path__deleted_at__isnull=True)
            .first()
        )
