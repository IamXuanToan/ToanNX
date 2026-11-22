"""Response một dòng của ma trận tùy chọn thông báo (sự kiện × kênh)."""

from typing import Any

from rest_framework import serializers

from app.system.serializers.responses.notification_event_response_serializer import (
    NotificationEventResponseSerializer,
)


class NotificationPreferenceItemResponseSerializer(serializers.Serializer[Any]):
    """Một sự kiện với các kênh đang bật."""

    event = NotificationEventResponseSerializer(help_text="Sự kiện.")
    in_app = serializers.BooleanField(help_text="Hiện trong chuông.")
    push = serializers.BooleanField(help_text="Thông báo trình duyệt.")
    email = serializers.BooleanField(help_text="Email.")
    telegram_chat_ids = serializers.ListField(child=serializers.UUIDField(), help_text="Chat Telegram nhận.")
    in_app_locked = serializers.BooleanField(help_text="Sự kiện lỗi: luôn hiện trong chuông.")
