"""Response một dòng của danh sách liên kết rút gọn (nhẹ, không có cảnh báo/mô tả dài)."""

from django.utils import timezone
from rest_framework import serializers

from app.core.context.user_context import get_current_request
from app.system.utils.frontend_url import get_frontend_origin
from app.utilities.models.short_link import ShortLink
from app.utilities.serializers.responses.short_link_owner_response_serializer import (
    ShortLinkOwnerResponseSerializer,
)


class ShortLinkListResponseSerializer(serializers.ModelSerializer[ShortLink]):
    """Dòng bảng: tên, URL ngắn, đích, bảo vệ, hạn, owner."""

    short_url = serializers.SerializerMethodField(help_text="URL ngắn tuyệt đối.")
    effective_status = serializers.SerializerMethodField(help_text="EXPIRED khi quá expires_at.")
    has_password = serializers.SerializerMethodField(help_text="Link có mật khẩu không.")
    owner = ShortLinkOwnerResponseSerializer(help_text="Chủ sở hữu.")

    class Meta:
        model = ShortLink
        fields = (
            "id",
            "name",
            "slug",
            "short_url",
            "destination_url",
            "auto_redirect_seconds",
            "has_password",
            "status",
            "effective_status",
            "expires_at",
            "clicks_count",
            "visitors_count",
            "last_accessed_at",
            "owner",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_short_url(self, obj: ShortLink) -> str:
        """Dựng URL công khai trên frontend."""
        request = get_current_request()
        return f"{get_frontend_origin(request)}/s/{obj.slug}"

    def get_effective_status(self, obj: ShortLink) -> str:
        """Tính hết hạn mà không ghi vào DB."""
        return "EXPIRED" if obj.expires_at is not None and obj.expires_at <= timezone.now() else obj.status

    def get_has_password(self, obj: ShortLink) -> bool:
        """Không bao giờ trả mã băm mật khẩu."""
        return bool(obj.password_hash)
