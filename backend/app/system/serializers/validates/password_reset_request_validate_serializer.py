"""Validate body POST /auth/password-reset/request."""

from rest_framework import serializers

from app.core.constants.defaults import DEFAULT_LOCALE
from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class PasswordResetRequestValidateSerializer(CoreValidateSerializer):
    """Yêu cầu gửi liên kết đặt lại mật khẩu qua email."""

    email = serializers.EmailField(
        max_length=254,
        help_text="Địa chỉ email đã đăng ký của tài khoản.",
    )
    locale = serializers.CharField(
        max_length=10,
        required=False,
        default=DEFAULT_LOCALE,
        help_text="Mã ngôn ngữ giao diện (vi hoặc en).",
    )
