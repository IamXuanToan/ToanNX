"""Service nghiệp vụ quản lý tác giả tiểu thuyết."""

from typing import Any

from app.core.services.core_crud_service import CoreCrudService
from app.core.utils.text import ascii_slug as to_slug
from app.modules.novel.models.author import Author
from app.modules.novel.repositories.author_repository import AuthorRepository


class AuthorService(CoreCrudService[Author, AuthorRepository]):
    """Service nghiệp vụ quản lý vòng đời và thông tin tác giả."""

    repository_class = AuthorRepository

    def __init__(self, repository: AuthorRepository | None = None) -> None:
        """Khởi tạo AuthorService.

        Args:
            repository: AuthorRepository tùy chọn, mặc định khởi tạo mới.
        """
        super().__init__(repository or AuthorRepository())

    def create(self, actor: Any, data: dict[str, Any]) -> Author:
        """Tạo mới một tác giả với slug tự động sinh từ tên nếu chưa có.

        Args:
            actor: Người thực hiện thao tác (User).
            data: Dữ liệu khởi tạo tác giả.

        Returns:
            Author: Thực thể tác giả mới được tạo.
        """
        data = dict(data)
        if not data.get("slug"):
            data["slug"] = to_slug(data["name"])
        return super().create(actor, data)
