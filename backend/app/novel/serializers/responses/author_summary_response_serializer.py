"""Serializer thông tin tóm tắt tác giả."""

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from app.attachment.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)
from app.novel.models.author import Author


class AuthorSummaryResponseSerializer(serializers.ModelSerializer[Author]):
    """Thông tin tóm tắt của tác giả."""

    avatar = serializers.SerializerMethodField(help_text="Ảnh đại diện tác giả.")

    @extend_schema_field(AttachmentSummaryResponseSerializer(allow_null=True))
    def get_avatar(self, obj: Author) -> dict[str, object] | None:
        if obj.avatar is None or obj.avatar.deleted_at is not None:
            return None
        return dict(AttachmentSummaryResponseSerializer(obj.avatar, context=self.context).data)

    class Meta:
        model = Author
        fields: tuple[str, ...] = ("id", "name", "slug", "bio", "avatar")
