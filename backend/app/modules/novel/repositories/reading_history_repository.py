"""Repository quản lý lịch sử đọc truyện."""

from typing import Any

from django.db.models import QuerySet
from django.utils import timezone

from app.core.repositories.core_repository import CoreRepository
from app.modules.novel.models.reading_history import ReadingHistory


class ReadingHistoryRepository(CoreRepository[ReadingHistory]):
    """Truy xuất cơ sở dữ liệu cho lịch sử đọc truyện."""

    model = ReadingHistory

    def get_queryset(self) -> QuerySet[ReadingHistory]:
        """Tối ưu queryset bằng cách nạp trước novel, chapter, thumbnail và user.

        Returns:
            QuerySet[ReadingHistory]: QuerySet đã được prefetch quan hệ.
        """
        return (
            super()
            .get_queryset()
            .select_related(
                "novel",
                "novel__thumbnail",
                "novel__author",
                "chapter",
                "chapter__thumbnail",
                "user",
            )
        )

    def list_for_user(self, user_id: Any) -> QuerySet[ReadingHistory]:
        """Lấy danh sách các mục lịch sử đọc của người dùng theo thời gian đọc gần nhất.

        Args:
            user_id: ID hoặc UUID của người dùng.

        Returns:
            QuerySet[ReadingHistory]: QuerySet lịch sử đọc.
        """
        return self.get_queryset().filter(user_id=user_id).order_by("-last_read_at")

    def record_read(self, actor: Any, novel_id: Any, chapter_id: Any) -> ReadingHistory:
        """Ghi nhận hoặc làm tươi thời điểm đọc chương truyện của người dùng.

        Args:
            actor: Người dùng thực hiện đọc (User).
            novel_id: ID tiểu thuyết.
            chapter_id: ID chương truyện.

        Returns:
            ReadingHistory: Bản ghi lịch sử đọc vừa tạo hoặc cập nhật.
        """
        history = self.model.objects.alive().filter(user_id=actor.pk, chapter_id=chapter_id).first()
        if history is not None:
            history.last_read_at = timezone.now()
            history.save(update_fields=["last_read_at", "updated_at"])
            return history
        return self.create(
            actor=actor,
            user_id=actor.pk,
            novel_id=novel_id,
            chapter_id=chapter_id,
        )

    def get_read_chapter_ids(self, user_id: Any, novel_id: Any) -> set[Any]:
        """Lấy tập hợp ID các chương mà người dùng đã đọc trong một tiểu thuyết.

        Args:
            user_id: ID người dùng.
            novel_id: ID tiểu thuyết.

        Returns:
            set[Any]: Tập hợp ID các chương đã đọc.
        """
        return set(
            self.model.objects.alive()
            .filter(user_id=user_id, novel_id=novel_id)
            .values_list("chapter_id", flat=True)
        )

    def find_latest_for_user_and_novel(self, user_id: Any, novel_id: Any) -> ReadingHistory | None:
        """Lấy bản ghi lịch sử đọc gần nhất của người dùng trong một tiểu thuyết.

        Args:
            user_id: ID người dùng.
            novel_id: ID tiểu thuyết.

        Returns:
            ReadingHistory | None: Bản ghi đọc gần nhất kèm chapter nếu có.
        """
        return (
            self.model.objects.alive()
            .filter(user_id=user_id, novel_id=novel_id)
            .select_related("chapter")
            .order_by("-last_read_at")
            .first()
        )

    def clear_all_for_user(self, user_id: Any) -> int:
        """Xóa toàn bộ các bản ghi lịch sử đọc của người dùng.

        Args:
            user_id: ID người dùng.

        Returns:
            int: Số lượng bản ghi đã được xóa.
        """
        return self.model.objects.alive().filter(user_id=user_id).delete()[0]
