"""Response danh sách trang."""

from rest_framework import serializers

from app.core.utils.absolute_url import build_absolute_url
from app.modules.custom_pages.models.page import Page


class PageListResponseSerializer(serializers.ModelSerializer[Page]):
    """Thông tin tóm tắt trang của actor."""

    public_url = serializers.SerializerMethodField(help_text="URL công khai tuyệt đối.")

    class Meta:
        model = Page
        fields: tuple[str, ...] = (
            "id",
            "owner_id",
            "title",
            "slug",
            "description",
            "status",
            "public_url",
            "created_at",
            "updated_at",
        )
        read_only_fields: tuple[str, ...] = fields

    def get_public_url(self, obj: Page) -> str:
        """Dựng URL theo domain hiện tại."""
        return build_absolute_url(f"/p/{obj.slug}")
