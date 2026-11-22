"""Sửa nhóm Telegram."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class TelegramChatUpdateValidateSerializer(CoreValidateSerializer):
    """Bật/tắt."""

    is_active = serializers.BooleanField(required=False, help_text="Đang bật.")
