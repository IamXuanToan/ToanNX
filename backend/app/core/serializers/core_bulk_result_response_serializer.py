"""Response của thao tác hàng loạt."""

from typing import Any

from rest_framework import serializers


class CoreBulkResultResponseSerializer(serializers.Serializer[Any]):
    """Số bản ghi đã xử lý."""

    count = serializers.IntegerField(help_text="Số bản ghi đã cập nhật/xóa.")
