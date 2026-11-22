"""Serializer danh sách chương."""

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from app.novel.models.chapter import Chapter
from app.system.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)


class ChapterListResponseSerializer(serializers.ModelSerializer[Chapter]):
    """Thông tin chương trong danh sách."""

    thumbnail = serializers.SerializerMethodField(help_text="Ảnh bìa/minh họa chương.")

    @extend_schema_field(AttachmentSummaryResponseSerializer(allow_null=True))
    def get_thumbnail(self, obj: Chapter) -> dict[str, object] | None:
        if obj.thumbnail is None or obj.thumbnail.deleted_at is not None:
            return None
        return dict(AttachmentSummaryResponseSerializer(obj.thumbnail, context=self.context).data)

    class Meta:
        model = Chapter
        fields: tuple[str, ...] = (
            "id",
            "novel_id",
            "chapter_number",
            "title",
            "slug",
            "thumbnail",
            "word_count",
            "views_count",
            "is_published",
            "created_at",
            "updated_at",
        )
