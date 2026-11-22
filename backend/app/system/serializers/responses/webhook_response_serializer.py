"""Response GET /system/webhooks."""

from typing import Any

from rest_framework import serializers


class WebhookResponseSerializer(serializers.Serializer[Any]):
    """Một webhook của hệ thống."""

    code = serializers.CharField(help_text="Mã `<module>.<tên>`.")
    module = serializers.CharField(help_text="Mã module.")
    name = serializers.CharField(help_text="Tên.")
    provider = serializers.CharField(help_text="Bên gọi webhook.")
    method = serializers.CharField(help_text="HTTP method.")
    path = serializers.CharField(help_text="Đường dẫn trên backend.")
    url = serializers.CharField(help_text="URL đầy đủ theo domain backend đang chạy.")
    description = serializers.CharField(help_text="Webhook nhận gì, xử lý thế nào.")
    auth = serializers.CharField(help_text="Cách xác thực.")
    setup = serializers.ListField(child=serializers.CharField(), help_text="Các bước cấu hình bên thứ ba.")
