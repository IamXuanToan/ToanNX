"""Service nghiệp vụ quản lý thẻ / hashtag tiểu thuyết."""

from typing import Any

from app.core.services.core_crud_service import CoreCrudService
from app.core.utils.text import ascii_slug as to_slug
from app.modules.novel.models.tag import Tag
from app.modules.novel.repositories.tag_repository import TagRepository


class TagService(CoreCrudService[Tag, TagRepository]):
    """Service nghiệp vụ quản lý vòng đời và thông tin thẻ / hashtag."""

    repository_class = TagRepository

    def __init__(self, repository: TagRepository | None = None) -> None:
        """Khởi tạo TagService.

        Args:
            repository: TagRepository tùy chọn, mặc định khởi tạo mới.
        """
        super().__init__(repository or TagRepository())

    def create(self, actor: Any, data: dict[str, Any]) -> Tag:
        """Tạo mới một thẻ với slug tự động sinh từ tên nếu chưa có.

        Args:
            actor: Người thực hiện thao tác (User).
            data: Dữ liệu khởi tạo thẻ.

        Returns:
            Tag: Thực thể thẻ mới được tạo.
        """
        data = dict(data)
        if not data.get("slug"):
            data["slug"] = to_slug(data["name"])
        return super().create(actor, data)
