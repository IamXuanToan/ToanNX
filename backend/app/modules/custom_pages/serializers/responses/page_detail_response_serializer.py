"""Response chi tiết trang quản lý."""

from rest_framework import serializers

from app.core.utils.url import build_absolute_url
from app.modules.custom_pages.serializers.responses.page_block_response_serializer import (
    PageBlockResponseSerializer,
)
from app.modules.custom_pages.serializers.responses.page_list_response_serializer import (
    PageListResponseSerializer,
)


class PageDetailResponseSerializer(PageListResponseSerializer):
    """Chi tiết trang cùng tất cả block chưa xóa, kể cả block ẩn."""

    blocks = PageBlockResponseSerializer(many=True, read_only=True, help_text="Các block theo thứ tự.")
    avatar_url = serializers.SerializerMethodField(help_text="URL ảnh đại diện tuyệt đối hoặc null.")
    cover_url = serializers.SerializerMethodField(help_text="URL ảnh bìa tuyệt đối hoặc null.")

    class Meta(PageListResponseSerializer.Meta):
        fields = (
            *PageListResponseSerializer.Meta.fields,
            "seo_title",
            "seo_description",
            "theme",
            "avatar_url",
            "cover_url",
            "blocks",
        )
        read_only_fields = fields

    def get_avatar_url(self, obj: object) -> str | None:
        """Ảnh đại diện còn tồn tại."""
        attachment = obj.avatar  # type: ignore[attr-defined]
        return (
            build_absolute_url(attachment.file.url) if attachment and attachment.deleted_at is None else None
        )

    def get_cover_url(self, obj: object) -> str | None:
        """Ảnh bìa còn tồn tại."""
        attachment = obj.cover  # type: ignore[attr-defined]
        return (
            build_absolute_url(attachment.file.url) if attachment and attachment.deleted_at is None else None
        )
