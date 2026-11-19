"""Repository quản lý thể loại tiểu thuyết."""

from typing import Any

from app.core.repositories.core_repository import CoreRepository
from app.core.utils.text import ascii_slug as to_slug
from app.modules.novel.models.genre import Genre


class GenreRepository(CoreRepository[Genre]):
    """Truy xuất cơ sở dữ liệu cho thể loại tiểu thuyết."""

    model = Genre

    def find_by_slug(self, slug: str) -> Genre | None:
        """Tìm kiếm thể loại theo slug định danh.

        Args:
            slug: Chuỗi slug cần tìm.

        Returns:
            Genre | None: Bản ghi thể loại nếu tồn tại, ngược lại None.
        """
        return self.find_one(slug=slug)

    def get_or_create_by_name(self, name: str, actor: Any = None) -> Genre:
        """Lấy thể loại đã có theo tên hoặc tự động tạo mới nếu chưa tồn tại.

        Args:
            name: Tên của thể loại.
            actor: Người thực hiện thao tác (User).

        Returns:
            Genre: Bản ghi thể loại tìm thấy hoặc mới tạo.
        """
        name = name.strip()
        slug = to_slug(name)
        genre = self.find_by_slug(slug)
        if genre is not None:
            return genre
        return self.create(actor=actor, name=name, slug=slug)
