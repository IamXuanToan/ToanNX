"""Response xóa một mục lịch sử đọc."""

from rest_framework import serializers


class ReadingHistoryDeleteResponseSerializer(serializers.Serializer[dict[str, object]]):
    """Kết quả xóa một mục lịch sử đọc."""

    deleted = serializers.BooleanField(help_text="Đã xóa thành công.")
