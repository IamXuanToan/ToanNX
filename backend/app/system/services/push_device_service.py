"""Thiết bị nhận thông báo trình duyệt (token FCM) của từng người."""

from typing import Any

from django.db import transaction
from django.utils import timezone

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.system.constants.notification_error_code import NotificationErrorCode
from app.system.models.push_device import PushDevice
from app.system.repositories.push_device_repository import PushDeviceRepository
from app.system.services.fcm_client import FcmClient


class PushDeviceService:
    """Upsert theo token: một trình duyệt chỉ thuộc người đang đăng nhập trên nó."""

    def __init__(
        self, repository: PushDeviceRepository | None = None, fcm_client: FcmClient | None = None
    ) -> None:
        """Khởi tạo phụ thuộc."""
        self.repository = repository or PushDeviceRepository()
        self.fcm_client = fcm_client or FcmClient()

    def is_configured(self) -> bool:
        """Firebase đã cấu hình (kênh PUSH dùng được)."""
        return self.fcm_client.is_configured()

    def list_for(self, actor: Any) -> list[PushDevice]:
        """Thiết bị đang dùng của actor."""
        return list(self.repository.filter(user_id=actor.pk, is_active=True))

    @transaction.atomic
    def register(self, actor: Any, token: str, label: str, user_agent: str) -> PushDevice:
        """Đăng ký/gia hạn token; token đang thuộc người khác thì chuyển sang actor."""
        if not self.is_configured():
            raise BusinessRuleError("Chưa cấu hình Firebase.", code=NotificationErrorCode.PUSH_NOT_CONFIGURED)
        now = timezone.now()
        fields = {
            "user": actor,
            "label": label[:120],
            "user_agent": user_agent[:500],
            "is_active": True,
            "last_seen_at": now,
        }
        device = self.repository.find_by_token(token)
        if device is None:
            return self.repository.create(actor=actor, fcm_token=token, **fields)
        return self.repository.update(device, actor=actor, deleted_at=None, deleted_by=None, **fields)

    @transaction.atomic
    def unregister(self, actor: Any, token: str) -> None:
        """Gỡ token của actor (đăng xuất, tắt thông báo)."""
        device = self.repository.find_by_token(token)
        if device is not None and device.user_id == actor.pk:
            self.repository.hard_delete(device)

    def deactivate(self, device_id: Any) -> None:
        """FCM báo token hết hạn/sai: tắt thiết bị."""
        device = self.repository.find_by_id(device_id)
        if device is not None:
            self.repository.update(device, is_active=False)

    def cleanup_stale(self, before: Any) -> int:
        """Xóa thiết bị không thấy từ trước mốc (cron dọn dẹp)."""
        return self.repository.hard_delete_where(last_seen_at__lt=before)
