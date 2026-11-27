"""Repository Két sắt Bí mật cá nhân."""

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.workspace.models.vault_item import VaultItem


class VaultItemRepository(CoreRepository[VaultItem]):
    """Truy xuất mục két sắt đã mã hóa."""

    model = VaultItem

    def get_queryset(self) -> QuerySet[VaultItem]:
        """Nạp trước chủ sở hữu và người mở xem gần nhất."""
        return super().get_queryset().select_related("owner", "last_revealed_by")
