"""Response danh sách PageFeedback."""

from rest_framework import serializers

from app.system.serializers.responses.email_template_owner_response_serializer import (
    EmailTemplateOwnerResponseSerializer,
)
from app.utilities.models.page_feedback import PageFeedback


class PageFeedbackListResponseSerializer(serializers.ModelSerializer[PageFeedback]):
    """Một dòng trong bảng quản lý góp ý/báo lỗi (Portal & Admin)."""

    target_owner = EmailTemplateOwnerResponseSerializer(read_only=True)

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
            "resolved_at",
            "thanked_at",
            "created_at",
            "updated_at",
        )
