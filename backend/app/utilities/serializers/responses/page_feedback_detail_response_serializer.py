"""Response chi tiết PageFeedback."""

from rest_framework import serializers

from app.system.serializers.responses.email_template_owner_response_serializer import (
    EmailTemplateOwnerResponseSerializer,
)
from app.utilities.models.page_feedback import PageFeedback


class PageFeedbackDetailResponseSerializer(serializers.ModelSerializer[PageFeedback]):
    """Chi tiết đầy đủ góp ý, trạng thái xử lý và thông tin đã cảm ơn."""

    target_owner = EmailTemplateOwnerResponseSerializer(read_only=True)
    resolved_by = EmailTemplateOwnerResponseSerializer(read_only=True, allow_null=True)
    thanked_by = EmailTemplateOwnerResponseSerializer(read_only=True, allow_null=True)

    class Meta:
        """Khai báo model và trường trả về."""

        model = PageFeedback
        fields = (
            "id",
            "target_type",
            "page_id",
            "short_link_id",
            "target_owner",
            "target_url",
            "target_title",
            "target_item_id",
            "feedback_type",
            "message",
            "sender_name",
            "sender_email",
            "status",
            "resolution_note",
            "resolved_at",
            "resolved_by",
            "thanked_at",
            "thanked_by",
            "thank_template_id",
            "created_at",
            "updated_at",
        )
