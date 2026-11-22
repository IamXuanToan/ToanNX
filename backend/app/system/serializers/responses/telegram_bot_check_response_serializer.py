"""Response kiểm tra bot Telegram."""

from typing import Any

from rest_framework import serializers

from app.system.serializers.responses.telegram_bot_response_serializer import TelegramBotResponseSerializer


class TelegramBotCheckResponseSerializer(serializers.Serializer[Any]):
    """Bot + có đang đặt webhook (getUpdates không dùng được)."""

    bot = TelegramBotResponseSerializer(help_text="Bot.")
    has_webhook = serializers.BooleanField(help_text="Bot đang đặt webhook ở nơi khác.")
