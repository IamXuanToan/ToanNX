"""Response POST /attachments và GET /attachments/{id}."""

from app.modules.attachment.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)


class AttachmentDetailResponseSerializer(AttachmentSummaryResponseSerializer):
    """Thông tin đầy đủ của file."""

    class Meta(AttachmentSummaryResponseSerializer.Meta):
        fields = (
            *AttachmentSummaryResponseSerializer.Meta.fields,
            "original_name",
            "content_type",
            "size",
            "created_at",
        )
