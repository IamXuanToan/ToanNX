"""Response GET /system/callbacks."""

from typing import Any

from rest_framework import serializers


class CallbackResponseSerializer(serializers.Serializer[Any]):
    """Một URL callback của hệ thống."""

    code = serializers.CharField(help_text="Mã `<module>.<tên>`.")
    module = serializers.CharField(help_text="Mã module.")
    name = serializers.CharField(help_text="Tên.")
    provider = serializers.CharField(help_text="Bên chuyển hướng về.")
    path = serializers.CharField(help_text="Đường dẫn trên FE.")
    url = serializers.CharField(help_text="URL đầy đủ theo origin FE đang dùng.")
    description = serializers.CharField(help_text="Dùng để làm gì.")
    setup = serializers.ListField(child=serializers.CharField(), help_text="Các bước khai phía bên thứ ba.")
    configured = serializers.BooleanField(help_text="Đã cấu hình client id/secret tương ứng.")
