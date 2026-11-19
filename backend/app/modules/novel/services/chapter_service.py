"""Service nghiệp vụ quản lý chương truyện."""

from typing import Any

from django.db import transaction

from app.core.exceptions.app_exception import AppException
from app.core.services.core_crud_service import CoreCrudService
from app.core.utils.text import ascii_slug as to_slug
from app.modules.novel.constants.novel_error_code import NovelErrorCode
from app.modules.novel.models.chapter import Chapter
from app.modules.novel.repositories.chapter_repository import ChapterRepository


class ChapterService(CoreCrudService[Chapter, ChapterRepository]):
    """Service nghiệp vụ quản lý vòng đời và dữ liệu chương truyện."""

    repository_class = ChapterRepository

    def __init__(self, repository: ChapterRepository | None = None) -> None:
        """Khởi tạo service với ChapterRepository.

        Args:
            repository: ChapterRepository tùy chọn, mặc định khởi tạo mới.
        """
        super().__init__(repository or ChapterRepository())
        self.chapter_repository: ChapterRepository = self.repository

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> Chapter:
        """Tạo mới một chương truyện với số chương độc nhất theo tiểu thuyết.

        Args:
            actor: Người thực hiện thao tác (User).
            data: Dữ liệu khởi tạo chương truyện.

        Returns:
            Chapter: Thực thể chương truyện mới được tạo.

        Raises:
            AppException: Nếu số chương đã tồn tại trong tiểu thuyết.
        """
        data = dict(data)
        novel_obj = data.get("novel")
        novel_id = data.get("novel_id") or (getattr(novel_obj, "pk", None) if novel_obj else None)
        chapter_number = data.get("chapter_number")

        if novel_id and chapter_number:
            existing = self.chapter_repository.find_by_novel_and_number(novel_id, chapter_number)
            if existing is not None:
                raise AppException(
                    f"Chương số {chapter_number} của truyện đã tồn tại.",
                    code=NovelErrorCode.CHAPTER_NUMBER_EXISTS,
                )

        if not data.get("slug"):
            data["slug"] = f"chuong-{chapter_number}" if chapter_number else to_slug(data.get("title", ""))

        if "content" in data and not data.get("word_count"):
            data["word_count"] = len(data["content"].split())

        return super().create(actor, data)

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Chapter:
        """Cập nhật thông tin và nội dung của một chương truyện.

        Args:
            actor: Người thực hiện thao tác (User).
            pk: Khóa chính của bản ghi Chapter cần sửa đổi.
            data: Dữ liệu cập nhật mới.

        Returns:
            Chapter: Thực thể chương truyện sau khi cập nhật.

        Raises:
            AppException: Nếu số chương mới bị trùng trong cùng một tiểu thuyết.
        """
        instance = self.get_for_write(actor, pk)
        data = dict(data)
        chapter_number = data.get("chapter_number")
        novel_id = getattr(instance, "novel_id", None)
        if chapter_number and chapter_number != instance.chapter_number and novel_id is not None:
            existing = self.chapter_repository.find_by_novel_and_number(novel_id, chapter_number)
            if existing is not None and existing.pk != instance.pk:
                raise AppException(
                    f"Chương số {chapter_number} của truyện đã tồn tại.",
                    code=NovelErrorCode.CHAPTER_NUMBER_EXISTS,
                )

        if "content" in data and "word_count" not in data:
            data["word_count"] = len(data["content"].split())

        return super().update(actor, pk, data)

    def find_by_novel_and_number(self, novel_id: Any, chapter_number: int) -> Chapter | None:
        """Tra cứu chương truyện theo ID tiểu thuyết và số thứ tự chương.

        Args:
            novel_id: ID tiểu thuyết.
            chapter_number: Số thứ tự chương.

        Returns:
            Chapter | None: Bản ghi chương nếu tìm thấy, ngược lại None.
        """
        return self.chapter_repository.find_by_novel_and_number(novel_id, chapter_number)

    def get_adjacent_chapters(self, novel_id: Any, chapter_number: int) -> tuple[int | None, int | None]:
        """Lấy số thứ tự của chương liền trước và chương liền sau đã xuất bản.

        Args:
            novel_id: ID tiểu thuyết.
            chapter_number: Số thứ tự chương hiện tại.

        Returns:
            tuple[int | None, int | None]: Cặp (số chương trước, số chương sau).
        """
        return self.chapter_repository.get_adjacent_chapters(novel_id, chapter_number)

    def increment_views(self, chapter_id: Any) -> None:
        """Tăng số lượt xem của chương truyện lên 1 đơn vị bằng F() expression.

        Args:
            chapter_id: ID hoặc UUID của chương truyện cần tăng lượt xem.
        """
        self.chapter_repository.increment_views(chapter_id)

    def list_published_for_novel(self, novel_id: Any) -> list[Chapter]:
        """Lấy danh sách các chương đã xuất bản của tiểu thuyết.

        Args:
            novel_id: ID hoặc UUID của tiểu thuyết.

        Returns:
            list[Chapter]: Danh sách các chương đã xuất bản theo thứ tự.
        """
        return self.chapter_repository.list_published_for_novel(novel_id)
