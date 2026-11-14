"""Validate body POST /auth/login."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class LoginValidateSerializer(CoreValidateSerializer):
    """Email + mật khẩu."""

    email = serializers.EmailField(max_length=254, help_text="Email đăng nhập (không phân biệt hoa thường).")
    password = serializers.CharField(
        max_length=128, trim_whitespace=False, write_only=True, help_text="Mật khẩu."
    )
