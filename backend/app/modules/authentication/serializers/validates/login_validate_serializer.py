"""Validate body POST /auth/login."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class LoginValidateSerializer(CoreValidateSerializer):
    """Tài khoản (email hoặc tên người dùng) + mật khẩu."""

    identifier = serializers.CharField(
        max_length=254,
        help_text="Email (không phân biệt hoa thường) hoặc tên người dùng.",
    )
    password = serializers.CharField(
        max_length=128, trim_whitespace=False, write_only=True, help_text="Mật khẩu."
    )
