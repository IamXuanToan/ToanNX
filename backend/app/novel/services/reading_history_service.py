"""Service nghiệp vụ quản lý lịch sử đọc truyện của độc giả."""

from typing import Any

from django.db.models import QuerySet

from app.novel.models.reading_history import ReadingHistory
from app.novel.repositories.reading_history_repository import (
    ReadingHistoryRepository,
)


class ReadingHistoryService:
    """Service nghiệp vụ lưu trữ, tra cứu và làm sạch lịch sử đọc truyện."""

    def __init__(self, repository: ReadingHistoryRepository | None = None) -> None:
        """Khởi tạo ReadingHistoryService.

        Args:
            repository: ReadingHistoryRepository tùy chọn, mặc định khởi tạo mới.
        """
        self.repository = repository or ReadingHistoryRepository()

    def list_for_user(self, user_id: Any) -> QuerySet[ReadingHistory]:
        """Lấy toàn bộ lịch sử đọc truyện của một người dùng cụ thể.

        Args:
            user_id: ID hoặc UUID của người dùng.

        Returns:
            QuerySet[ReadingHistory]: Danh sách lịch sử đọc đã sắp xếp theo thời gian mới nhất.
        """
        return self.repository.list_for_user(user_id)

    def record_read(self, actor: Any, novel_id: Any, chapter_id: Any) -> ReadingHistory:
        """Ghi nhận tiến độ đọc chương truyện của độc giả (tạo mới hoặc cập nhật).

        Args:
            actor: Người dùng thực hiện đọc truyện.
            novel_id: ID của tiểu thuyết.
            chapter_id: ID của chương vừa đọc.

        Returns:
            ReadingHistory: Bản ghi lịch sử đọc vừa được ghi nhận.
        """
        return self.repository.record_read(actor, novel_id, chapter_id)

    def get_read_chapter_ids(self, user_id: Any, novel_id: Any) -> set[Any]:
        """Lấy tập hợp các ID chương mà người dùng đã đọc trong một tiểu thuyết.

        Args:
            user_id: ID của người dùng.
            novel_id: ID của tiểu thuyết.

        Returns:
            set[Any]: Tập hợp các ID chương đã đọc.
        """
        return self.repository.get_read_chapter_ids(user_id, novel_id)

    def get_latest_read_chapter_number(self, user_id: Any, novel_id: Any) -> int | None:
        """Lấy số thứ tự chương đọc gần nhất của người dùng trong một tiểu thuyết.

        Args:
            user_id: ID hoặc UUID của người dùng.
            novel_id: ID hoặc UUID của tiểu thuyết.

        Returns:
            int | None: Số chương đọc gần nhất nếu có, ngược lại None.
        """
        history = self.repository.find_latest_for_user_and_novel(user_id, novel_id)
        if history and history.chapter:
            return history.chapter.chapter_number
        return None

    def delete_item(self, actor: Any, history_id: Any) -> bool:
        """Xóa một mục lịch sử đọc cụ thể thuộc sở hữu của người dùng.

        Args:
            actor: Người dùng yêu cầu xóa (phải là chủ sở hữu).
            history_id: ID bản ghi lịch sử đọc cần xóa.

        Returns:
            bool: True nếu xóa thành công, False nếu bản ghi không tồn tại hoặc không thuộc quyền.
        """
        item = self.repository.find_one(pk=history_id, user_id=actor.pk)
        if item is not None:
            self.repository.delete(item, actor=actor)
            return True
        return False

    def clear_all(self, actor: Any) -> int:
        """Xóa toàn bộ lịch sử đọc truyện của người dùng hiện tại.

        Args:
            actor: Người dùng yêu cầu làm sạch lịch sử.

        Returns:
            int: Số lượng bản ghi lịch sử đã được xóa.
        """
        return self.repository.clear_all_for_user(actor.pk)
