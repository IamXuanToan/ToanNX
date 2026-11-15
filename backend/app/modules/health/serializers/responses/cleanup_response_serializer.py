"""Response của GET /health/cleanup."""

from typing import Any

from rest_framework import serializers


class CleanupResponseSerializer(serializers.Serializer[Any]):
    """Kết quả từng task dọn dữ liệu."""

    results = serializers.DictField(
        child=serializers.IntegerField(), help_text="`{đường dẫn task: số bản ghi đã xóa}`; -1 là task lỗi."
    )
