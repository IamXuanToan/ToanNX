"""Validate body POST /auth/password-reset/validate-token."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class PasswordResetValidateTokenSerializer(CoreValidateSerializer):
    """Kiểm tra tính hợp lệ của token đặt lại mật khẩu."""

    uid = serializers.CharField(
        max_length=128,
        help_text="Base64 encode của mã người dùng.",
    )
    token = serializers.CharField(
        max_length=256,
        help_text="Token xác thực một lần.",
    )
