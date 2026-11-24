"""Response một dòng của danh sách trang (không có nội dung)."""

from rest_framework import serializers

from app.core.context.user_context import get_current_request
from app.system.utils.frontend_url import get_frontend_origin
from app.utilities.models.page import Page
from app.utilities.serializers.responses.page_owner_response_serializer import (
    PageOwnerResponseSerializer,
)
from app.utilities.serializers.responses.page_path_summary_response_serializer import (
    PagePathSummaryResponseSerializer,
)


class PageListResponseSerializer(serializers.ModelSerializer[Page]):
    """Tiêu đề, URL công khai, đường dẫn giữa, trạng thái, owner."""

    public_url = serializers.SerializerMethodField(help_text="URL công khai tuyệt đối `/<segment>/<slug>`.")
    path = PagePathSummaryResponseSerializer(help_text="Đường dẫn giữa.")
    owner = PageOwnerResponseSerializer(help_text="Chủ sở hữu.")

    class Meta:
        model = Page
        fields: tuple[str, ...] = (
            "id",
            "title",
            "slug",
            "status",
            "page_type",
            "template_key",
            "path",
            "public_url",
            "owner",
            "published_at",
            "created_at",
            "updated_at",
        )
        read_only_fields: tuple[str, ...] = fields

    def get_public_url(self, obj: Page) -> str:
        """URL công khai trên frontend."""
        request = get_current_request()
        return f"{get_frontend_origin(request)}/{obj.path.segment}/{obj.slug}"
