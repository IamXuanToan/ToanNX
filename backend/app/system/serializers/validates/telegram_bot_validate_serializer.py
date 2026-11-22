"""Lưu token bot Telegram."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class TelegramBotValidateSerializer(CoreValidateSerializer):
    """Token tạo ở @BotFather (chỉ ghi, không bao giờ trả lại)."""

    token = serializers.CharField(max_length=200, write_only=True, help_text="Token bot.")
