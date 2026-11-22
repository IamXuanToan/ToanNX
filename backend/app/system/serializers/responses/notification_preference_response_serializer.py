"""Response ma trận tùy chọn thông báo."""

from typing import Any

from rest_framework import serializers

from app.system.serializers.responses.notification_preference_item_response_serializer import (
    NotificationPreferenceItemResponseSerializer,
)


class NotificationPreferenceResponseSerializer(serializers.Serializer[Any]):
    """Kênh dùng được + ma trận."""

    channels = serializers.ListField(child=serializers.CharField(), help_text="Kênh actor dùng được.")
    items = NotificationPreferenceItemResponseSerializer(many=True, help_text="Sự kiện × kênh.")
