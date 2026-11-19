"""Repository quản lý chương truyện."""

from typing import Any

from django.db.models import F, QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.modules.novel.models.chapter import Chapter


class ChapterRepository(CoreRepository[Chapter]):
    """Truy xuất cơ sở dữ liệu cho chương truyện."""

    model = Chapter

    def get_queryset(self) -> QuerySet[Chapter]:
        """Tối ưu queryset bằng cách nạp trước novel và thumbnail.

        Returns:
            QuerySet[Chapter]: QuerySet có select_related novel và thumbnail.
        """
        return super().get_queryset().select_related("novel", "thumbnail")

    def find_by_novel_and_number(self, novel_id: Any, chapter_number: int) -> Chapter | None:
        """Tra cứu chương truyện theo ID tiểu thuyết và số thứ tự chương.

        Args:
            novel_id: ID tiểu thuyết.
            chapter_number: Số thứ tự chương.

        Returns:
            Chapter | None: Bản ghi chương nếu tìm thấy, ngược lại None.
        """
        return self.find_one(novel_id=novel_id, chapter_number=chapter_number)

    def get_adjacent_chapters(self, novel_id: Any, chapter_number: int) -> tuple[int | None, int | None]:
        """Lấy số thứ tự của chương liền kề trước và sau đã xuất bản.

        Args:
            novel_id: ID tiểu thuyết.
            chapter_number: Số thứ tự chương hiện tại.

        Returns:
            tuple[int | None, int | None]: Cặp (số chương trước, số chương sau).
        """
        prev_ch = (
            self.model.objects.alive()
            .filter(
                novel_id=novel_id,
                is_published=True,
                chapter_number__lt=chapter_number,
            )
            .order_by("-chapter_number")
            .values_list("chapter_number", flat=True)
            .first()
        )
        next_ch = (
            self.model.objects.alive()
            .filter(
                novel_id=novel_id,
                is_published=True,
                chapter_number__gt=chapter_number,
            )
            .order_by("chapter_number")
            .values_list("chapter_number", flat=True)
            .first()
        )
        return prev_ch, next_ch

    def increment_views(self, chapter_id: Any) -> None:
        """Tăng số lượt xem của chương truyện bằng F() expression.

        Args:
            chapter_id: ID của chương truyện cần tăng lượt xem.
        """
        self.model.objects.filter(pk=chapter_id).update(views_count=F("views_count") + 1)

    def list_published_for_novel(self, novel_id: Any) -> list[Chapter]:
        """Lấy danh sách các chương đã xuất bản của tiểu thuyết theo thứ tự số chương.

        Args:
            novel_id: ID hoặc UUID của tiểu thuyết.

        Returns:
            list[Chapter]: Danh sách các chương đã xuất bản.
        """
        return list(
            self.model.objects.alive().filter(novel_id=novel_id, is_published=True).order_by("chapter_number")
        )
