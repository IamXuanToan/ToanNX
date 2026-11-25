"""Service nghiệp vụ quản lý truyện yêu thích của độc giả."""

from typing import Any

from django.db.models import QuerySet

from app.core.exceptions.not_found_error import NotFoundError
from app.novel.models.favorite import Favorite
from app.novel.permissions.novel_permission import NovelPermission
from app.novel.repositories.favorite_repository import FavoriteRepository
from app.novel.repositories.novel_repository import NovelRepository


class FavoriteService:
    """Service nghiệp vụ lưu trữ và chuyển đổi trạng thái truyện yêu thích."""

    def __init__(
        self,
        repository: FavoriteRepository | None = None,
        novel_repository: NovelRepository | None = None,
    ) -> None:
        """Khởi tạo FavoriteService.

        Args:
            repository: FavoriteRepository tùy chọn, mặc định khởi tạo mới.
            novel_repository: NovelRepository tùy chọn để kiểm tra quyền truy cập truyện.
        """
        self.repository = repository or FavoriteRepository()
        self.novel_repository = novel_repository or NovelRepository()

    def list_for_user(self, user_id: Any) -> QuerySet[Favorite]:
        """Lấy danh sách các bản ghi truyện yêu thích của một người dùng cụ thể.

        Args:
            user_id: ID hoặc UUID của người dùng.

        Returns:
            QuerySet[Favorite]: Danh sách các bản ghi yêu thích đã prefetch.
        """
        return self.repository.list_for_user(user_id)

    def is_favorite(self, user_id: Any, novel_id: Any) -> bool:
        """Kiểm tra người dùng đã đánh dấu yêu thích tiểu thuyết này hay chưa.

        Args:
            user_id: ID của người dùng.
            novel_id: ID của tiểu thuyết.

        Returns:
            bool: True nếu đã thích, ngược lại False.
        """
        return self.repository.is_favorite(user_id, novel_id)

    def toggle(self, actor: Any, novel_id: Any) -> tuple[bool, int]:
        """Chuyển đổi (thêm/xóa) trạng thái yêu thích của người dùng với tiểu thuyết.

        Tự động cập nhật số lượt yêu thích (`favorites_count`) của tiểu thuyết.

        Args:
            actor: Người dùng thực hiện thao tác.
            novel_id: ID của tiểu thuyết.

        Returns:
            tuple[bool, int]: Cặp (trạng thái sau khi toggle, tổng số lượt thích mới).
        """
        novel = self.novel_repository.find_by_id(novel_id)
        can_access_draft = (
            novel is not None
            and actor.has_perm(NovelPermission.READ.code)
            and (novel.owner_id == actor.pk or actor.has_perm(NovelPermission.MANAGE_ALL.code))
        )
        if novel is None or (not novel.is_published and not can_access_draft):
            raise NotFoundError("Không tìm thấy truyện.")
        return self.repository.toggle(actor, novel.pk)
