"""Repository quản lý tác giả tiểu thuyết."""

from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.core.utils.text import ascii_slug as to_slug
from app.modules.novel.models.author import Author


class AuthorRepository(CoreRepository[Author]):
    """Truy xuất cơ sở dữ liệu cho tác giả tiểu thuyết."""

    model = Author

    def get_queryset(self) -> QuerySet[Author]:
        """Tối ưu queryset bằng cách nạp trước ảnh đại diện avatar.

        Returns:
            QuerySet[Author]: QuerySet có select_related avatar.
        """
        return super().get_queryset().select_related("avatar")

    def find_by_slug(self, slug: str) -> Author | None:
        """Tìm kiếm tác giả theo slug định danh.

        Args:
            slug: Chuỗi slug cần tìm.

        Returns:
            Author | None: Bản ghi tác giả nếu tồn tại, ngược lại None.
        """
        return self.find_one(slug=slug)

    def get_or_create_by_name(self, name: str, actor: Any = None) -> Author:
        """Lấy tác giả đã có theo tên hoặc tự động tạo mới nếu chưa tồn tại.

        Args:
            name: Tên của tác giả.
            actor: Người thực hiện thao tác (User).

        Returns:
            Author: Bản ghi tác giả tìm thấy hoặc mới tạo.
        """
        name = name.strip()
        slug = to_slug(name)
        author = self.find_by_slug(slug)
        if author is not None:
            return author
        return self.create(actor=actor, name=name, slug=slug)
