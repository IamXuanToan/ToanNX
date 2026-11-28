"""Repository liên kết rút gọn."""

from typing import Any

from django.db.models import F, QuerySet
from django.db.models.functions import Lower
from django.utils import timezone

from app.core.repositories.core_repository import CoreRepository
from app.utilities.models.short_link import ShortLink


class ShortLinkRepository(CoreRepository[ShortLink]):
    """Truy cập liên kết chưa xóa mềm."""

    model = ShortLink

    def get_queryset(self) -> QuerySet[ShortLink]:
        """Chỉ liên kết còn tồn tại, kèm owner cho danh sách (không N+1)."""
        return super().get_queryset().select_related("owner")

    def find_by_slug(self, slug: str) -> ShortLink | None:
        """Tìm liên kết theo slug không phân biệt hoa thường."""
        return self.get_queryset().filter(slug__iexact=slug).first()

    def existing_slugs_ci(self, slugs: list[str]) -> set[str]:
        """Tập slug (chữ thường) đã có trong DB trong danh sách cho trước, 1 query (kể cả bản ghi xóa mềm)."""
        lowered = [slug.lower() for slug in slugs if slug]
        if not lowered:
            return set()
        rows = (
            self.get_queryset_with_deleted()
            .annotate(slug_lower=Lower("slug"))
            .filter(slug_lower__in=lowered)
            .values_list("slug_lower", flat=True)
        )
        return {str(row) for row in rows}

    def record_access(self, link_id: Any, is_new_visitor: bool) -> None:
        """Ghi nhận lượt truy cập bằng F() expression, đảm bảo an toàn tranh chấp (concurrency).

        Args:
            link_id: ID liên kết rút gọn.
            is_new_visitor: True nếu là người truy cập mới (tăng visitors_count).
        """
        updates: dict[str, Any] = {
            "clicks_count": F("clicks_count") + 1,
            "last_accessed_at": timezone.now(),
        }
        if is_new_visitor:
            updates["visitors_count"] = F("visitors_count") + 1
        self.model.objects.filter(pk=link_id).update(**updates)
