"""Response serializer cho các action thành công của password reset."""

from typing import Any

from rest_framework import serializers


class PasswordResetDetailResponseSerializer(serializers.Serializer[Any]):
    """Thông báo chi tiết kết quả thao tác."""

    detail = serializers.CharField(help_text="Nội dung thông báo.")
