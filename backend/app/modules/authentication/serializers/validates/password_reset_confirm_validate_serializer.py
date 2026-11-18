"""Validate body POST /auth/password-reset/confirm."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class PasswordResetConfirmValidateSerializer(CoreValidateSerializer):
    """Xác nhận đặt lại mật khẩu mới."""

    uid = serializers.CharField(
        max_length=128,
        help_text="Base64 encode của mã người dùng.",
    )
    token = serializers.CharField(
        max_length=256,
        help_text="Token xác thực một lần.",
    )
    new_password = serializers.CharField(
        max_length=128,
        trim_whitespace=False,
        write_only=True,
        help_text="Mật khẩu mới.",
    )
