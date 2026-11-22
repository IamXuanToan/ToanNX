"""API chi tiết tiểu thuyết cho giao diện người đọc."""

from typing import Any

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request

from app.core.exceptions.not_found_error import NotFoundError
from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.core.responses.core_response import CoreResponse
from app.core.views.core_api_view import CoreApiView
from app.novel.serializers.responses.novel_client_detail_response_serializer import (
    NovelClientDetailResponseSerializer,
)
from app.novel.services.chapter_service import ChapterService
from app.novel.services.favorite_service import FavoriteService
from app.novel.services.novel_service import NovelService
from app.novel.services.reading_history_service import ReadingHistoryService


class NovelClientView(CoreApiView):
    """Chi tiết bộ tiểu thuyết kèm trạng thái đọc và yêu thích của người dùng hiện tại."""

    permission_classes = [IsActiveAuthenticated]

    def __init__(
        self,
        novel_service: NovelService | None = None,
        chapter_service: ChapterService | None = None,
        favorite_service: FavoriteService | None = None,
        history_service: ReadingHistoryService | None = None,
        **kwargs: Any,
    ) -> None:
        """Khởi tạo view với các service nghiệp vụ liên quan.

        Args:
            novel_service: NovelService quản lý tiểu thuyết.
            chapter_service: ChapterService quản lý chương truyện.
            favorite_service: FavoriteService quản lý yêu thích.
            history_service: ReadingHistoryService quản lý lịch sử đọc.
            **kwargs: Các tham số bổ sung cho CoreApiView.
        """
        super().__init__(**kwargs)
        self.novel_service = novel_service or NovelService()
        self.chapter_service = chapter_service or ChapterService()
        self.favorite_service = favorite_service or FavoriteService()
        self.history_service = history_service or ReadingHistoryService()

    @extend_schema(responses={200: NovelClientDetailResponseSerializer})
    def get(self, request: Request, slug: str) -> CoreResponse:
        """Lấy chi tiết truyện theo slug cùng lịch sử đọc của người dùng.

        Args:
            request: Đối tượng Request từ client.
            slug: Chuỗi slug định danh tiểu thuyết trên URL.

        Returns:
            CoreResponse: Chi tiết tiểu thuyết kèm các cờ hiển thị độc giả.

        Raises:
            NotFoundError: Nếu truyện không tồn tại hoặc chưa phát hành và user không phải staff.
        """
        actor = self.get_actor(request)
        novel = self.novel_service.find_by_slug(slug)
        if novel is None or (not novel.is_published and not getattr(actor, "is_staff", False)):
            raise NotFoundError("Không tìm thấy truyện.")

        # Tăng lượt xem
        self.novel_service.increment_views(novel.pk)

        # Kiểm tra yêu thích
        is_fav = self.favorite_service.is_favorite(actor.pk, novel.pk)

        # Lấy danh sách ID chương đã đọc
        read_chapter_ids = self.history_service.get_read_chapter_ids(actor.pk, novel.pk)

        # Lấy thông tin các chương đã xuất bản qua chapter_service
        chapters = self.chapter_service.list_published_for_novel(novel.pk)
        read_numbers = [ch.chapter_number for ch in chapters if ch.pk in read_chapter_ids]

        # Lấy số thứ tự chương đọc gần nhất qua history_service
        latest_read_number = self.history_service.get_latest_read_chapter_number(actor.pk, novel.pk)
        first_chapter_number = chapters[0].chapter_number if chapters else None

        serializer = NovelClientDetailResponseSerializer(novel, context={"request": request})
        data = dict(serializer.data)
        data["is_favorite"] = is_fav
        data["read_chapter_numbers"] = read_numbers
        data["latest_read_chapter_number"] = latest_read_number
        data["first_chapter_number"] = first_chapter_number

        return CoreResponse(data)
