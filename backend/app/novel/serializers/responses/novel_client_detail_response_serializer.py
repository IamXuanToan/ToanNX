"""Serializer chi tiết truyện phía giao diện người đọc."""

from rest_framework import serializers

from app.novel.serializers.responses.novel_detail_response_serializer import (
    NovelDetailResponseSerializer,
)


class NovelClientDetailResponseSerializer(NovelDetailResponseSerializer):
    """Thông tin truyện phía client: kèm trạng thái yêu thích và lịch sử đọc của người dùng."""

    is_favorite = serializers.BooleanField(
        default=False, help_text="Người dùng hiện tại đã đánh dấu yêu thích truyện hay chưa."
    )
    read_chapter_numbers = serializers.ListField(
        child=serializers.IntegerField(),
        default=list,
        help_text="Danh sách số thứ tự các chương người dùng đã đọc.",
    )
    latest_read_chapter_number = serializers.IntegerField(
        allow_null=True,
        required=False,
        help_text="Số thứ tự chương người dùng đọc gần đây nhất.",
    )
    first_chapter_number = serializers.IntegerField(
        allow_null=True,
        required=False,
        help_text="Số thứ tự chương đầu tiên của truyện.",
    )

    class Meta(NovelDetailResponseSerializer.Meta):
        fields: tuple[str, ...] = (
            *NovelDetailResponseSerializer.Meta.fields,
            "is_favorite",
            "read_chapter_numbers",
            "latest_read_chapter_number",
            "first_chapter_number",
        )
