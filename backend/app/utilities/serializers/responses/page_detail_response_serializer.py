"""Response chi tiết trang cho editor."""

from typing import Any

from rest_framework import serializers

from app.system.serializers.responses.attachment_summary_response_serializer import (
    AttachmentSummaryResponseSerializer,
)
from app.utilities.serializers.responses.page_list_response_serializer import (
    PageListResponseSerializer,
)


class PageDetailResponseSerializer(PageListResponseSerializer):
    """Mọi trường soạn được; `content` đã dựng URL ảnh/link rút gọn (service gắn `editor_content`)."""

    avatar = AttachmentSummaryResponseSerializer(allow_null=True, help_text="Ảnh đại diện.")
    cover = AttachmentSummaryResponseSerializer(allow_null=True, help_text="Ảnh bìa.")
    background_image = AttachmentSummaryResponseSerializer(allow_null=True, help_text="Ảnh nền trang.")
    content = serializers.SerializerMethodField(help_text="Tài liệu Tiptap JSON cho editor.")

    class Meta(PageListResponseSerializer.Meta):
        fields = (
            *PageListResponseSerializer.Meta.fields,
            "description",
            "seo_title",
            "seo_description",
            "theme",
            "page_type",
            "template_key",
            "template_version",
            "content_config",
            "style_config",
            "responsive_config",
            "avatar",
            "cover",
            "background_image",
            "content",
            "content_version",
        )
        read_only_fields = fields

    def get_content(self, obj: Any) -> dict[str, Any]:
        """Nội dung đã dựng sẵn ở service (serializer không truy vấn DB)."""
        return dict(getattr(obj, "editor_content", None) or obj.content or {})
