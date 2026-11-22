"""Serializer truyện yêu thích."""

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from app.novel.models.favorite import Favorite
from app.system.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)


class FavoriteResponseSerializer(serializers.ModelSerializer[Favorite]):
    """Thông tin một mục truyện yêu thích."""

    novel_id = serializers.UUIDField(source="novel.id", help_text="Mã truyện.")
    novel_title = serializers.CharField(source="novel.title", help_text="Tên truyện.")
    novel_slug = serializers.CharField(source="novel.slug", help_text="Slug truyện.")
    novel_status = serializers.CharField(source="novel.status", help_text="Trạng thái truyện.")
    novel_thumbnail = serializers.SerializerMethodField(help_text="Ảnh bìa truyện.")
    novel_author_name = serializers.CharField(
        source="novel.author.name", allow_null=True, required=False, help_text="Tên tác giả."
    )

    @extend_schema_field(AttachmentSummaryResponseSerializer(allow_null=True))
    def get_novel_thumbnail(self, obj: Favorite) -> dict[str, object] | None:
        if obj.novel.thumbnail is None or obj.novel.thumbnail.deleted_at is not None:
            return None
        return dict(AttachmentSummaryResponseSerializer(obj.novel.thumbnail, context=self.context).data)

    class Meta:
        model = Favorite
        fields: tuple[str, ...] = (
            "id",
            "novel_id",
            "novel_title",
            "novel_slug",
            "novel_status",
            "novel_thumbnail",
            "novel_author_name",
            "created_at",
        )
