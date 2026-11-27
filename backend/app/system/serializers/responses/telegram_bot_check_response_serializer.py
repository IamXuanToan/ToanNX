"""Response kiểm tra và đồng bộ webhook Bot Telegram chung."""

from typing import Any

from rest_framework import serializers

from app.system.serializers.responses.telegram_bot_response_serializer import TelegramBotResponseSerializer


class TelegramBotCheckResponseSerializer(serializers.Serializer[Any]):
    """Thông tin bot + trạng thái đồng bộ webhook hiện tại."""

    bot = TelegramBotResponseSerializer(help_text="Thông tin bot dùng chung.")
    webhook_active = serializers.BooleanField(help_text="Webhook Telegram đã được gắn URL hợp lệ chưa.")
    webhook_url = serializers.CharField(allow_blank=True, help_text="URL webhook hiện tại trên Telegram.")
    last_error_code = serializers.CharField(allow_blank=True, help_text="Thông báo/mã lỗi webhook gần nhất.")
