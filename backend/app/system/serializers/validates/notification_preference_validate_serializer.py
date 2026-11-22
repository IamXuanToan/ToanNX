"""Cập nhật ma trận tùy chọn thông báo."""

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.system.serializers.validates.notification_preference_item_validate_serializer import (
    NotificationPreferenceItemValidateSerializer,
)


class NotificationPreferenceValidateSerializer(CoreValidateSerializer):
    """Các sự kiện cần đồng bộ (sự kiện không gửi thì giữ nguyên)."""

    items = NotificationPreferenceItemValidateSerializer(many=True, help_text="Sự kiện × kênh.")
