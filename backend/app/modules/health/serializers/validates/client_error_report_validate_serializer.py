"""Validate body POST /health/client-errors."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class ClientErrorReportValidateSerializer(CoreValidateSerializer):
    """Lỗi trình duyệt bắt được ở error boundary (đã cắt độ dài phía FE)."""

    message = serializers.CharField(max_length=1000, help_text="Thông báo lỗi.")
    digest = serializers.CharField(
        max_length=100, required=False, allow_blank=True, help_text="Mã lỗi của Next (khớp log server)."
    )
    url = serializers.CharField(max_length=500, help_text="Đường dẫn trang lúc lỗi (không gồm query).")
    stack = serializers.CharField(
        max_length=4000, required=False, allow_blank=True, help_text="Stack trace rút gọn."
    )
