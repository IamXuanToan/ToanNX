"""Service nghiệp vụ quản lý tiểu thuyết."""

from typing import Any

from django.db import transaction

from app.core.exceptions.app_exception import AppException
from app.core.services.core_crud_service import CoreCrudService
from app.core.utils.text import ascii_slug as to_slug
from app.novel.constants.novel_error_code import NovelErrorCode
from app.novel.models.novel import Novel
from app.novel.permissions.novel_permission import NovelPermission
from app.novel.repositories.author_repository import AuthorRepository
from app.novel.repositories.genre_repository import GenreRepository
from app.novel.repositories.novel_repository import NovelRepository
from app.novel.repositories.tag_repository import TagRepository


class NovelService(CoreCrudService[Novel, NovelRepository]):
    """Service nghiệp vụ quản lý vòng đời và dữ liệu tiểu thuyết."""

    repository_class = NovelRepository
    owner_field = "owner"
    manage_all_permission = NovelPermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: NovelRepository | None = None,
        author_repository: AuthorRepository | None = None,
        genre_repository: GenreRepository | None = None,
        tag_repository: TagRepository | None = None,
    ) -> None:
        """Khởi tạo service với các repository phụ thuộc.

        Args:
            repository: NovelRepository chính của service.
            author_repository: AuthorRepository để tra cứu tác giả.
            genre_repository: GenreRepository để gán thể loại.
            tag_repository: TagRepository để gán nhãn thẻ.
        """
        super().__init__(repository or NovelRepository())
        self.novel_repository: NovelRepository = self.repository
        self.author_repository = author_repository or AuthorRepository()
        self.genre_repository = genre_repository or GenreRepository()
        self.tag_repository = tag_repository or TagRepository()

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> Novel:
        """Tạo mới một tiểu thuyết và thiết lập quan hệ thể loại, nhãn thẻ.

        Args:
            actor: Người thực hiện thao tác (User).
            data: Dữ liệu khởi tạo tiểu thuyết đã qua validate.

        Returns:
            Novel: Thực thể tiểu thuyết mới được tạo.

        Raises:
            AppException: Nếu slug bị trùng lặp trong hệ thống.
        """
        data = dict(data)
        if not data.get("slug"):
            data["slug"] = to_slug(data["title"])

        existing = self.novel_repository.find_by_slug(data["slug"])
        if existing is not None:
            raise AppException("Slug của truyện đã tồn tại.", code=NovelErrorCode.NOVEL_SLUG_EXISTS)

        genre_ids = data.pop("genre_ids", None)
        tag_ids = data.pop("tag_ids", None)

        novel = super().create(actor, data)
        if genre_ids is not None:
            novel.genres.set(genre_ids)
        if tag_ids is not None:
            novel.tags.set(tag_ids)
        return novel

    def list_stale_for(self, actor: Any, cutoff: Any, *, limit: int = 15) -> list[Novel]:
        """Danh sách truyện do chính `actor` sở hữu bị bỏ quên trước `cutoff` (cho AI tool cá nhân)."""
        return self.novel_repository.list_stale_for_owner(actor.pk, cutoff, limit=limit)

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Novel:
        """Cập nhật thông tin tiểu thuyết và đồng bộ quan hệ nhiều-nhiều.

        Args:
            actor: Người thực hiện thao tác (User).
            pk: Khóa chính của bản ghi Novel cần sửa đổi.
            data: Dữ liệu cập nhật mới.

        Returns:
            Novel: Thực thể tiểu thuyết sau khi cập nhật.

        Raises:
            AppException: Nếu slug mới bị trùng với truyện khác.
        """
        instance = self.get_for_write(actor, pk)
        data = dict(data)
        if "slug" in data and data["slug"] != instance.slug:
            existing = self.novel_repository.find_by_slug(data["slug"])
            if existing is not None and existing.pk != instance.pk:
                raise AppException("Slug của truyện đã tồn tại.", code=NovelErrorCode.NOVEL_SLUG_EXISTS)

        genre_ids = data.pop("genre_ids", None)
        tag_ids = data.pop("tag_ids", None)

        novel = super().update(actor, pk, data)
        if genre_ids is not None:
            novel.genres.set(genre_ids)
        if tag_ids is not None:
            novel.tags.set(tag_ids)
        return novel

    def find_by_slug(self, slug: str) -> Novel | None:
        """Tra cứu tiểu thuyết theo slug định danh URL.

        Args:
            slug: Chuỗi định danh slug cần tìm.

        Returns:
            Novel | None: Bản ghi tiểu thuyết nếu tìm thấy, ngược lại None.
        """
        return self.novel_repository.find_by_slug(slug)

    def increment_views(self, novel_id: Any) -> None:
        """Tăng số lượt xem của tiểu thuyết lên 1 đơn vị bằng F() expression.

        Args:
            novel_id: ID hoặc UUID của tiểu thuyết cần tăng lượt xem.
        """
        self.novel_repository.increment_views(novel_id)
