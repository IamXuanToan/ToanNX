"""Response thông tin Bot Telegram dùng chung toàn hệ thống (không bao giờ trả token)."""

from typing import Any

from rest_framework import serializers


class TelegramBotResponseSerializer(serializers.Serializer[Any]):
    """Metadata Bot Telegram chung từ cấu hình môi trường."""

    configured = serializers.BooleanField(help_text="Đã cấu hình TELEGRAM_BOT_TOKEN hay chưa.")
    username = serializers.CharField(allow_blank=True, help_text="Username bot (không gồm @).")
    display_name = serializers.CharField(allow_blank=True, help_text="Tên hiển thị của bot.")
    bot_url = serializers.CharField(allow_blank=True, help_text="Link mở chat với bot trên Telegram.")
