"""Validate body POST /auth/accept-invitation."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class AcceptInvitationValidateSerializer(CoreValidateSerializer):
    """Body kích hoạt tài khoản và thiết lập mật khẩu lần đầu qua lời mời."""

    token = serializers.CharField(
        max_length=512,
        help_text="Token lời mời nhận được qua email.",
    )
    full_name = serializers.CharField(
        max_length=255,
        help_text="Họ và tên đầy đủ của người dùng.",
    )
    username = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        default=None,
        max_length=150,
        help_text="Tên người dùng mong muốn (tùy chọn).",
    )
    password = serializers.CharField(
        write_only=True,
        max_length=128,
        trim_whitespace=False,
        help_text="Mật khẩu mới (tối thiểu 10 ký tự, không quá phổ biến).",
    )
