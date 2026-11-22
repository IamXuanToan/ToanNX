"""Một sự kiện trong ma trận tùy chọn gửi lên."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class NotificationPreferenceItemValidateSerializer(CoreValidateSerializer):
    """Kênh bật cho một sự kiện."""

    event_code = serializers.CharField(max_length=100, help_text="Mã sự kiện.")
    in_app = serializers.BooleanField(help_text="Hiện trong chuông.")
    push = serializers.BooleanField(required=False, default=False, help_text="Thông báo trình duyệt.")
    email = serializers.BooleanField(required=False, default=False, help_text="Email.")
    telegram_chat_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, default=list, help_text="Chat Telegram nhận."
    )
