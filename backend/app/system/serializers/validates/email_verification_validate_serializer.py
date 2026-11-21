"""Validate body POST /auth/verify-email."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class EmailVerificationValidateSerializer(CoreValidateSerializer):
    """Body xác minh email chứa token."""

    token = serializers.CharField(
        max_length=512,
        help_text="Token xác minh nhận được qua email.",
    )
