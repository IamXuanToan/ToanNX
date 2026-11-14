"""Response block trong trang quản lý."""

from rest_framework import serializers

from app.modules.custom_pages.models.page_block import PageBlock


class PageBlockResponseSerializer(serializers.ModelSerializer[PageBlock]):
    """Block của trang thuộc actor."""

    class Meta:
        model = PageBlock
        fields = (
            "id",
            "page_id",
            "block_type",
            "content",
            "position",
            "is_visible",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
