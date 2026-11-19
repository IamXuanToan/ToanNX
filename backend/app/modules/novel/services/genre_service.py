"""Service nghiệp vụ quản lý thể loại tiểu thuyết."""

from typing import Any

from app.core.services.core_crud_service import CoreCrudService
from app.core.utils.text import ascii_slug as to_slug
from app.modules.novel.models.genre import Genre
from app.modules.novel.repositories.genre_repository import GenreRepository


class GenreService(CoreCrudService[Genre, GenreRepository]):
    """Service nghiệp vụ quản lý vòng đời và thông tin thể loại tiểu thuyết."""

    repository_class = GenreRepository

    def __init__(self, repository: GenreRepository | None = None) -> None:
        """Khởi tạo GenreService.

        Args:
            repository: GenreRepository tùy chọn, mặc định khởi tạo mới.
        """
        super().__init__(repository or GenreRepository())

    def create(self, actor: Any, data: dict[str, Any]) -> Genre:
        """Tạo mới một thể loại với slug tự động sinh từ tên nếu chưa có.

        Args:
            actor: Người thực hiện thao tác (User).
            data: Dữ liệu khởi tạo thể loại.

        Returns:
            Genre: Thực thể thể loại mới được tạo.
        """
        data = dict(data)
        if not data.get("slug"):
            data["slug"] = to_slug(data["name"])
        return super().create(actor, data)
