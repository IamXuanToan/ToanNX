"""Response một dòng của danh sách liên kết rút gọn (nhẹ, không có cảnh báo/mô tả dài)."""

from django.utils import timezone
from rest_framework import serializers

from app.core.utils.url import build_absolute_url
from app.modules.short_links.models.short_link import ShortLink
from app.modules.short_links.serializers.responses.short_link_owner_response_serializer import (
    ShortLinkOwnerResponseSerializer,
)


class ShortLinkListResponseSerializer(serializers.ModelSerializer[ShortLink]):
    """Dòng bảng: tên, URL ngắn, đích, kiểu, trạng thái hiệu lực, hạn, owner."""

    short_url = serializers.SerializerMethodField(help_text="URL ngắn tuyệt đối.")
    effective_status = serializers.SerializerMethodField(help_text="EXPIRED khi quá expires_at.")
    owner = ShortLinkOwnerResponseSerializer(help_text="Chủ sở hữu.")

    class Meta:
        model = ShortLink
        fields = (
            "id",
            "name",
            "slug",
            "short_url",
            "destination_url",
            "redirect_type",
            "status",
            "effective_status",
            "expires_at",
            "owner",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_short_url(self, obj: ShortLink) -> str:
        """Dựng URL công khai."""
        return build_absolute_url(f"/s/{obj.slug}")

    def get_effective_status(self, obj: ShortLink) -> str:
        """Tính hết hạn mà không ghi vào DB."""
        return "EXPIRED" if obj.expires_at is not None and obj.expires_at <= timezone.now() else obj.status
