"""Response GET /health/ready."""

from typing import Any

from rest_framework import serializers


class ReadinessResponseSerializer(serializers.Serializer[Any]):
    """Trạng thái sẵn sàng phục vụ."""

    status = serializers.CharField(help_text="`ready` khi database kết nối được.")
