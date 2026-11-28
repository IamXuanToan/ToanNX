"""Response nơi nhận Telegram."""

from rest_framework import serializers

from app.system.models.telegram_chat import TelegramChat


class TelegramChatResponseSerializer(serializers.ModelSerializer[TelegramChat]):
    """Nơi nhận (không trả mã đăng ký sau khi xác minh)."""

    class Meta:
        model = TelegramChat
        fields = (
            "id",
            "chat_id",
            "title",
            "chat_type",
            "status",
            "is_active",
            "group_reply_mode",
            "registration_expires_at",
            "last_verified_at",
            "last_error_code",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
