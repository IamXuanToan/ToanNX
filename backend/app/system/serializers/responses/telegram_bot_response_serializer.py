"""Response bot Telegram (không bao giờ trả token)."""

from rest_framework import serializers

from app.system.models.telegram_bot import TelegramBot


class TelegramBotResponseSerializer(serializers.ModelSerializer[TelegramBot]):
    """Bot của chính người dùng."""

    class Meta:
        model = TelegramBot
        fields = (
            "id",
            "username",
            "display_name",
            "token_last4",
            "is_active",
            "last_checked_at",
            "last_error_code",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
