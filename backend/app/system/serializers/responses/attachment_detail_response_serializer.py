"""Response POST /attachments và GET /attachments/{id}."""

from rest_framework import serializers

from app.system.models.attachment import Attachment
from app.system.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)


class AttachmentDetailResponseSerializer(AttachmentSummaryResponseSerializer):
    """Thông tin đầy đủ của file."""

    uploader_name = serializers.SerializerMethodField(help_text="Tên hiển thị của người upload.")
    created_by_id = serializers.UUIDField(read_only=True, allow_null=True, help_text="Id người upload.")
    folder_id = serializers.UUIDField(read_only=True, allow_null=True, help_text="Id nhóm logic hoặc null.")
    folder_name = serializers.CharField(
        source="folder.name", read_only=True, default="", help_text="Tên nhóm logic."
    )
    alt_text = serializers.CharField(
        read_only=True,
        default="",
        help_text="Văn bản thay thế (alt) cho ảnh phục vụ SEO & accessibility.",
    )

    def get_uploader_name(self, obj: Attachment) -> str:
        """Đọc người upload đã được repository select_related, không truy vấn bổ sung."""
        return obj.created_by.display_name if obj.created_by else ""

    class Meta(AttachmentSummaryResponseSerializer.Meta):
        fields = (
            *AttachmentSummaryResponseSerializer.Meta.fields,
            "original_name",
            "alt_text",
            "content_type",
            "size",
            "created_at",
            "created_by_id",
            "uploader_name",
            "folder_id",
            "folder_name",
        )
