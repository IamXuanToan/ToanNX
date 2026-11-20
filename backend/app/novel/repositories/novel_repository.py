"""Repository quản lý tiểu thuyết."""

from typing import Any

from django.db.models import Count, F, Q, QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.novel.models.novel import Novel


class NovelRepository(CoreRepository[Novel]):
    """Truy xuất cơ sở dữ liệu cho tiểu thuyết."""

    model = Novel

    def get_queryset(self) -> QuerySet[Novel]:
        """Tối ưu queryset bằng cách nạp trước author, thumbnail, owner, genres, tags và đếm số chương.

        Returns:
            QuerySet[Novel]: QuerySet đã được prefetch và annotate đầy đủ.
        """
        return (
            super()
            .get_queryset()
            .select_related("author", "author__avatar", "thumbnail", "owner")
            .prefetch_related("genres", "tags")
            .annotate(
                chapters_count_annotated=Count(
                    "chapters",
                    filter=Q(chapters__deleted_at__isnull=True),
                    distinct=True,
                )
            )
        )

    def find_by_slug(self, slug: str) -> Novel | None:
        """Tìm kiếm tiểu thuyết theo slug định danh URL.

        Args:
            slug: Chuỗi slug cần tìm.

        Returns:
            Novel | None: Bản ghi tiểu thuyết nếu tồn tại, ngược lại None.
        """
        return self.find_one(slug=slug)

    def increment_views(self, novel_id: Any) -> None:
        """Tăng số lượt xem của tiểu thuyết bằng F() expression.

        Args:
            novel_id: ID của tiểu thuyết cần tăng lượt xem.
        """
        self.model.objects.filter(pk=novel_id).update(views_count=F("views_count") + 1)

    def update_favorites_count(self, novel_id: Any, count: int) -> None:
        """Cập nhật tổng số lượt yêu thích của tiểu thuyết.

        Args:
            novel_id: ID của tiểu thuyết.
            count: Số lượng người dùng yêu thích mới.
        """
        self.model.objects.filter(pk=novel_id).update(favorites_count=count)
