"""API nội dung chương đọc truyện cho client."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.exceptions.not_found_error import NotFoundError
from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.modules.novel.serializers.responses.chapter_detail_response_serializer import (
    ChapterDetailResponseSerializer,
)
from app.modules.novel.services.chapter_service import ChapterService
from app.modules.novel.services.novel_service import NovelService
from app.modules.novel.services.reading_history_service import ReadingHistoryService


class ChapterClientView(CoreApiView):
    """Nội dung chương truyện dành cho giao diện đọc (tự động ghi nhận lịch sử)."""

    permission_classes = [IsActiveAuthenticated]

    def __init__(
        self,
        chapter_service: ChapterService | None = None,
        novel_service: NovelService | None = None,
        history_service: ReadingHistoryService | None = None,
        **kwargs: Any,
    ) -> None:
        """Khởi tạo view với các service nghiệp vụ liên quan.

        Args:
            chapter_service: ChapterService quản lý chương truyện.
            novel_service: NovelService quản lý tiểu thuyết.
            history_service: ReadingHistoryService quản lý lịch sử đọc.
            **kwargs: Các tham số bổ sung cho CoreApiView.
        """
        super().__init__(**kwargs)
        self.chapter_service = chapter_service or ChapterService()
        self.novel_service = novel_service or NovelService()
        self.history_service = history_service or ReadingHistoryService()

    @extend_schema(responses={200: ChapterDetailResponseSerializer})
    def get(self, request: Request, novel_slug: str, chapter_number: int) -> CoreResponse:
        """Lấy nội dung chương đọc theo slug truyện và số chương.

        Args:
            request: Đối tượng Request từ client.
            novel_slug: Slug định danh tiểu thuyết.
            chapter_number: Số thứ tự chương cần đọc.

        Returns:
            CoreResponse: Chi tiết nội dung chương kèm điều hướng chương kế bên.

        Raises:
            NotFoundError: Nếu truyện hoặc chương không tồn tại hoặc chưa xuất bản.
        """
        actor = self.get_actor(request)
        novel = self.novel_service.find_by_slug(novel_slug)
        if novel is None or (not novel.is_published and not getattr(actor, "is_staff", False)):
            raise NotFoundError("Không tìm thấy truyện.")

        chapter = self.chapter_service.find_by_novel_and_number(novel.pk, chapter_number)
        if chapter is None or (not chapter.is_published and not getattr(actor, "is_staff", False)):
            raise NotFoundError("Không tìm thấy chương truyện.")

        # Tăng lượt xem chương và truyện
        self.chapter_service.increment_views(chapter.pk)
        self.novel_service.increment_views(novel.pk)

        # Ghi nhận lịch sử đọc tự động
        self.history_service.record_read(actor, novel.pk, chapter.pk)

        # Lấy số chương kế bên
        prev_num, next_num = self.chapter_service.get_adjacent_chapters(novel.pk, chapter.chapter_number)

        serializer = ChapterDetailResponseSerializer(chapter, context={"request": request})
        data = dict(serializer.data)
        data["prev_chapter_number"] = prev_num
        data["next_chapter_number"] = next_num

        return CoreResponse(data)
