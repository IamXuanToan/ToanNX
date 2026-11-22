"""Response bật/tắt yêu thích truyện."""

from rest_framework import serializers


class FavoriteToggleResponseSerializer(serializers.Serializer[dict[str, object]]):
    """Kết quả bật/tắt yêu thích."""

    is_favorite = serializers.BooleanField(help_text="Trạng thái yêu thích mới.")
    favorites_count = serializers.IntegerField(help_text="Tổng lượt thích của truyện sau khi cập nhật.")
