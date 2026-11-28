"""Repository trang tùy chỉnh."""

from typing import Any

from django.db.models import QuerySet
from django.db.models.functions import Lower

from app.core.repositories.core_repository import CoreRepository
from app.utilities.models.page import Page


class PageRepository(CoreRepository[Page]):
    """Truy cập trang chưa xóa mềm (kèm đường dẫn giữa, owner, ảnh — không N+1)."""

    model = Page

    def get_queryset(self) -> QuerySet[Page]:
        """Trang còn tồn tại."""
        return super().get_queryset().select_related("path", "owner", "avatar", "cover", "background_image")

    def list_active_donation_pages(self) -> QuerySet[Page]:
        """Danh sách trang DONATION chưa xóa mềm dùng để tra cứu webhook token."""
        return self.filter(page_type=Page.PageType.DONATION)

    def find_published_by_id(self, page_id: Any) -> Page | None:
        """Trang đang công khai theo UUID."""
        return self.find_one(id=page_id, status=Page.Status.PUBLISHED)

    def list_stale_for_owner(self, owner_id: Any, cutoff: Any, *, limit: int = 15) -> list[Page]:
        """Trang cá nhân chưa cập nhật trước mốc `cutoff`."""
        return list(
            self.get_queryset()
            .filter(owner_id=owner_id, updated_at__lt=cutoff)
            .order_by("updated_at")[:limit]
        )

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
