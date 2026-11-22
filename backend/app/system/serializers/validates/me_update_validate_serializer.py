"""Validate body PATCH /auth/me."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class MeUpdateValidateSerializer(CoreValidateSerializer):
    """Dữ liệu cập nhật hồ sơ cá nhân của người dùng hiện tại."""

    email = serializers.EmailField(
        required=False,
        max_length=254,
        help_text="Email đăng nhập (lưu chữ thường, duy nhất).",
    )
    full_name = serializers.CharField(
        required=False, allow_blank=False, max_length=255, help_text="Họ và tên đầy đủ."
    )
    username = serializers.CharField(
        required=False,
        allow_blank=False,
        max_length=150,
        help_text="Tên người dùng.",
    )
    avatar_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="Id attachment ảnh đại diện; null để gỡ ảnh.",
    )
    password = serializers.CharField(
        required=False,
        write_only=True,
        max_length=128,
        trim_whitespace=False,
        help_text="Mật khẩu mới.",
    )
