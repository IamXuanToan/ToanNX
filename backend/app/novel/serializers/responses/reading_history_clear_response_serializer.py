"""Response xóa toàn bộ lịch sử đọc."""

from rest_framework import serializers


class ReadingHistoryClearResponseSerializer(serializers.Serializer[dict[str, object]]):
    """Kết quả xóa toàn bộ lịch sử đọc."""

    deleted_count = serializers.IntegerField(help_text="Số mục đã xóa.")
