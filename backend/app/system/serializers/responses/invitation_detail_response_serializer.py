"""Response GET /auth/invitation."""

from typing import Any

from rest_framework import serializers


class InvitationDetailResponseSerializer(serializers.Serializer[Any]):
    """Thông tin lời mời tài khoản trả về cho client."""

    email = serializers.EmailField(help_text="Email được mời tham gia.")
    full_name = serializers.CharField(help_text="Họ và tên đã điền sẵn nếu có.")
    username = serializers.CharField(allow_null=True, help_text="Tên người dùng đã điền sẵn nếu có.")
