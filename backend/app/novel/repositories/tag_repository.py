"""Repository quản lý thẻ / hashtag tiểu thuyết."""

from typing import Any

from app.core.repositories.core_repository import CoreRepository
from app.core.utils.text import ascii_slug as to_slug
from app.novel.models.tag import Tag


class TagRepository(CoreRepository[Tag]):
    """Truy xuất cơ sở dữ liệu cho thẻ / hashtag tiểu thuyết."""

    model = Tag

    def find_by_slug(self, slug: str) -> Tag | None:
        """Tìm kiếm thẻ theo slug định danh.

        Args:
            slug: Chuỗi slug cần tìm.

        Returns:
            Tag | None: Bản ghi thẻ nếu tồn tại, ngược lại None.
        """
        return self.find_one(slug=slug)

    def get_or_create_by_name(self, name: str, actor: Any = None) -> Tag:
        """Lấy thẻ đã có theo tên hoặc tự động tạo mới nếu chưa tồn tại.

        Args:
            name: Tên của thẻ.
            actor: Người thực hiện thao tác (User).

        Returns:
            Tag: Bản ghi thẻ tìm thấy hoặc mới tạo.
        """
        name = name.strip()
        slug = to_slug(name)
        tag = self.find_by_slug(slug)
        if tag is not None:
            return tag
        return self.create(actor=actor, name=name, slug=slug)
