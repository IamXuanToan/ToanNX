"""Repository quản lý truyện yêu thích."""

from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.modules.novel.models.favorite import Favorite
from app.modules.novel.repositories.novel_repository import NovelRepository


class FavoriteRepository(CoreRepository[Favorite]):
    """Truy xuất cơ sở dữ liệu cho truyện yêu thích."""

    model = Favorite

    def __init__(self, novel_repository: NovelRepository | None = None) -> None:
        """Khởi tạo FavoriteRepository với NovelRepository.

        Args:
            novel_repository: NovelRepository để đồng bộ số lượt yêu thích.
        """
        super().__init__()
        self.novel_repository = novel_repository or NovelRepository()

    def get_queryset(self) -> QuerySet[Favorite]:
        """Tối ưu queryset bằng cách nạp trước novel, thumbnail, author và thể loại.

        Returns:
            QuerySet[Favorite]: QuerySet đã được tối ưu hóa quan hệ.
        """
        return (
            super()
            .get_queryset()
            .select_related("novel", "novel__thumbnail", "novel__author", "user")
            .prefetch_related("novel__genres", "novel__tags")
        )

    def list_for_user(self, user_id: Any) -> QuerySet[Favorite]:
        """Lấy danh sách các truyện yêu thích của một người dùng, xếp theo mới nhất.

        Args:
            user_id: ID hoặc UUID của người dùng.

        Returns:
            QuerySet[Favorite]: QuerySet các mục yêu thích.
        """
        return self.get_queryset().filter(user_id=user_id).order_by("-created_at")

    def is_favorite(self, user_id: Any, novel_id: Any) -> bool:
        """Kiểm tra sự tồn tại của bản ghi yêu thích giữa người dùng và tiểu thuyết.

        Args:
            user_id: ID người dùng.
            novel_id: ID tiểu thuyết.

        Returns:
            bool: True nếu đã thích, ngược lại False.
        """
        return self.model.objects.alive().filter(user_id=user_id, novel_id=novel_id).exists()

    def toggle(self, actor: Any, novel_id: Any) -> tuple[bool, int]:
        """Chuyển đổi trạng thái yêu thích và tự động đồng bộ `favorites_count` của tiểu thuyết.

        Args:
            actor: Người dùng thực hiện thao tác (User).
            novel_id: ID của tiểu thuyết.

        Returns:
            tuple[bool, int]: Cặp (trạng thái sau toggle, tổng số lượt thích mới).
        """
        fav = self.model.objects.alive().filter(user_id=actor.pk, novel_id=novel_id).first()
        if fav is not None:
            self.hard_delete(fav)
            is_fav = False
        else:
            self.create(actor=actor, user_id=actor.pk, novel_id=novel_id)
            is_fav = True

        total_favs = self.model.objects.alive().filter(novel_id=novel_id).count()
        self.novel_repository.update_favorites_count(novel_id, total_favs)
        return is_fav, total_favs
