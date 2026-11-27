"""Owner rút gọn trong danh sách mã QR."""

from typing import Any

from rest_framework import serializers


class QrCodeOwnerResponseSerializer(serializers.Serializer[Any]):
    """Thông tin tối thiểu của owner, không lộ cờ quyền."""

    id = serializers.UUIDField(help_text="Id người dùng.")
    email = serializers.EmailField(help_text="Email.")
    username = serializers.CharField(
        allow_null=True, allow_blank=True, default="", help_text="Tên đăng nhập."
    )
    username = serializers.CharField(
        allow_null=True, allow_blank=True, default="", help_text="Tên đăng nhập."
    )
    full_name = serializers.CharField(help_text="Họ tên đầy đủ.")
