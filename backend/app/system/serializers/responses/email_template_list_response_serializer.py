"""Response danh sách EmailTemplate."""

from rest_framework import serializers

from app.system.models.email_template import EmailTemplate
from app.system.serializers.responses.email_template_owner_response_serializer import (
    EmailTemplateOwnerResponseSerializer,
)


class EmailTemplateListResponseSerializer(serializers.ModelSerializer[EmailTemplate]):
    """Dữ liệu tóm tắt một mẫu email trong bảng danh sách."""

    owner = EmailTemplateOwnerResponseSerializer(read_only=True, allow_null=True)
    available_locales = serializers.SerializerMethodField()

    class Meta:
        """Khai báo model và trường trả về."""

        model = EmailTemplate
        fields = (
            "id",
            "code",
            "name",
            "description",
            "locale",
            "available_locales",
            "scope",
            "category",
            "status",
            "subject",
            "is_system_default",
            "owner",
            "created_at",
            "updated_at",
        )

    def get_available_locales(self, obj: EmailTemplate) -> list[str]:
        """Trả danh sách mã ngôn ngữ đã có nội dung trong mẫu."""
        if isinstance(obj.translations, dict) and obj.translations:
            return [str(k) for k in obj.translations]
        return [obj.locale or "vi"]
