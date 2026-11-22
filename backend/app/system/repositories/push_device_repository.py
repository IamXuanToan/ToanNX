"""Repository thiết bị nhận push."""

from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.system.models.push_device import PushDevice


class PushDeviceRepository(CoreRepository[PushDevice]):
    """Truy cập dữ liệu PushDevice."""

    model = PushDevice

    def active_for_users(self, user_ids: list[Any]) -> QuerySet[PushDevice]:
        """Thiết bị đang dùng của nhiều người."""
        return self.get_queryset().filter(user_id__in=user_ids, is_active=True)

    def find_by_token(self, token: str) -> PushDevice | None:
        """Thiết bị theo token (kể cả của người khác: token chuyển chủ khi đăng nhập tài khoản khác)."""
        return self.get_queryset_with_deleted().filter(fcm_token=token).first()
