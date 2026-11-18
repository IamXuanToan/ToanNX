"""Response POST /auth/password-reset/validate-token."""

from typing import Any

from rest_framework import serializers


class PasswordResetTokenValidResponseSerializer(serializers.Serializer[Any]):
    """Kết quả kiểm tra tính hợp lệ của token."""

    valid = serializers.BooleanField(help_text="True nếu token hợp lệ và còn hạn.")
