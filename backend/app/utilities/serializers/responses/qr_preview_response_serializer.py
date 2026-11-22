"""Response POST /utilities/qr-codes/preview."""

from typing import Any

from rest_framework import serializers


class QrPreviewResponseSerializer(serializers.Serializer[Any]):
    """Payload và ảnh SVG (data URL) để hiển thị bằng `<img>`."""

    payload = serializers.CharField(help_text="Chuỗi mã hóa vào QR.")
    svg = serializers.CharField(help_text="`data:image/svg+xml;base64,...`.")
