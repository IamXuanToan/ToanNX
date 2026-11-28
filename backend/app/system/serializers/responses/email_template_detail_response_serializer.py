"""Response chi tiết EmailTemplate."""

from rest_framework import serializers

from app.system.models.email_template import EmailTemplate
from app.system.serializers.responses.email_template_owner_response_serializer import (
    EmailTemplateOwnerResponseSerializer,
)


class EmailTemplateDetailResponseSerializer(serializers.ModelSerializer[EmailTemplate]):
    """Chi tiết đầy đủ mẫu email gồm Tiptap JSON, HTML sạch và danh sách trường trộn."""

    owner = EmailTemplateOwnerResponseSerializer(read_only=True, allow_null=True)

    class Meta:
        """Khai báo model và trường trả về."""

        model = EmailTemplate
        fields = (
            "id",
            "code",
            "name",
            "description",
            "locale",
            "scope",
            "category",
            "status",
            "subject",
            "content",
            "html_body",
            "translations",
            "variables",
            "is_system_default",
            "owner",
            "created_at",
            "updated_at",
        )
