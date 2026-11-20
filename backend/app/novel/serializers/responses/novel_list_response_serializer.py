"""Serializer danh sách truyện."""

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from app.novel.models.novel import Novel
from app.novel.serializers.responses.author_summary_response_serializer import (
    AuthorSummaryResponseSerializer,
)
from app.novel.serializers.responses.genre_summary_response_serializer import (
    GenreSummaryResponseSerializer,
)
from app.novel.serializers.responses.tag_summary_response_serializer import (
    TagSummaryResponseSerializer,
)
from app.system.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)


class NovelListResponseSerializer(serializers.ModelSerializer[Novel]):
    """Thông tin truyện trong danh sách."""

    author = AuthorSummaryResponseSerializer(allow_null=True, help_text="Tác giả truyện.")
    genres = GenreSummaryResponseSerializer(many=True, help_text="Danh sách thể loại.")
    tags = TagSummaryResponseSerializer(many=True, help_text="Danh sách thẻ.")
    thumbnail = serializers.SerializerMethodField(help_text="Ảnh bìa truyện.")
    chapters_count = serializers.SerializerMethodField(help_text="Tổng số chương đã phát hành.")

    @extend_schema_field(AttachmentSummaryResponseSerializer(allow_null=True))
    def get_thumbnail(self, obj: Novel) -> dict[str, object] | None:
        if obj.thumbnail is None or obj.thumbnail.deleted_at is not None:
            return None
        return dict(AttachmentSummaryResponseSerializer(obj.thumbnail, context=self.context).data)

    @extend_schema_field(serializers.IntegerField())
    def get_chapters_count(self, obj: Novel) -> int:
        annotated = getattr(obj, "chapters_count_annotated", None)
        if annotated is not None:
            return int(annotated)
        chapters_manager = getattr(obj, "chapters", None)
        if chapters_manager is not None:
            return int(chapters_manager.filter(deleted_at__isnull=True).count())
        return 0

    class Meta:
        model = Novel
        fields: tuple[str, ...] = (
            "id",
            "title",
            "slug",
            "original_title",
            "status",
            "thumbnail",
            "author",
            "genres",
            "tags",
            "views_count",
            "favorites_count",
            "is_published",
            "chapters_count",
            "created_at",
            "updated_at",
        )
