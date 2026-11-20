"""Serializer lịch sử đọc truyện."""

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from app.attachment.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)
from app.novel.models.reading_history import ReadingHistory


class ReadingHistoryResponseSerializer(serializers.ModelSerializer[ReadingHistory]):
    """Thông tin một mục lịch sử đọc."""

    novel_id = serializers.UUIDField(source="novel.id", help_text="Mã truyện.")
    novel_title = serializers.CharField(source="novel.title", help_text="Tên truyện.")
    novel_slug = serializers.CharField(source="novel.slug", help_text="Slug truyện.")
    novel_thumbnail = serializers.SerializerMethodField(help_text="Ảnh bìa truyện.")
    novel_author_name = serializers.CharField(
        source="novel.author.name", allow_null=True, required=False, help_text="Tên tác giả."
    )
    chapter_id = serializers.UUIDField(source="chapter.id", help_text="Mã chương.")
    chapter_number = serializers.IntegerField(source="chapter.chapter_number", help_text="Số thứ tự chương.")
    chapter_title = serializers.CharField(source="chapter.title", help_text="Tiêu đề chương.")

    @extend_schema_field(AttachmentSummaryResponseSerializer(allow_null=True))
    def get_novel_thumbnail(self, obj: ReadingHistory) -> dict[str, object] | None:
        if obj.novel.thumbnail is None or obj.novel.thumbnail.deleted_at is not None:
            return None
        return dict(AttachmentSummaryResponseSerializer(obj.novel.thumbnail, context=self.context).data)

    class Meta:
        model = ReadingHistory
        fields: tuple[str, ...] = (
            "id",
            "novel_id",
            "novel_title",
            "novel_slug",
            "novel_thumbnail",
            "novel_author_name",
            "chapter_id",
            "chapter_number",
            "chapter_title",
            "last_read_at",
        )


class ReadingHistoryDeleteResponseSerializer(serializers.Serializer[dict[str, object]]):
    """Kết quả xóa một mục lịch sử đọc."""

    deleted = serializers.BooleanField(help_text="Đã xóa thành công.")


class ReadingHistoryClearResponseSerializer(serializers.Serializer[dict[str, object]]):
    """Kết quả xóa toàn bộ lịch sử đọc."""

    deleted_count = serializers.IntegerField(help_text="Số mục đã xóa.")
