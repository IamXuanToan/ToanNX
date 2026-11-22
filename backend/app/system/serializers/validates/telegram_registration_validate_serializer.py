"""Tạo mã đăng ký nơi nhận Telegram."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer

KIND_CHOICES = (("group", "Nhóm"), ("private", "Chat riêng với bot"))


class TelegramRegistrationValidateSerializer(CoreValidateSerializer):
    """Loại nơi nhận."""

    kind = serializers.ChoiceField(
        choices=KIND_CHOICES, required=False, default="group", help_text="group / private."
    )
