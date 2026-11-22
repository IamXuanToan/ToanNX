"""Response GET /health."""

from typing import Any

from rest_framework import serializers


class HealthResponseSerializer(serializers.Serializer[Any]):
    """Trạng thái tiến trình."""

    status = serializers.CharField(help_text="Luôn là `ok` khi tiến trình phản hồi.")
    debug = serializers.BooleanField(help_text="Đang chạy chế độ DEBUG hay không.")
