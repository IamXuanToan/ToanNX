"""Validate mật khẩu mở liên kết."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class ShortLinkUnlockValidateSerializer(CoreValidateSerializer):
    """Mật khẩu được gửi riêng, không nằm trong URL."""

    password = serializers.CharField(
        allow_blank=True,
        max_length=128,
        trim_whitespace=False,
        help_text="Mật khẩu do người tạo đặt; rỗng với link không khóa.",
    )
