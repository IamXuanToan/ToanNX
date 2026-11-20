"""Response quản lý liên kết rút gọn."""

from django.utils import timezone
from rest_framework import serializers

from app.core.utils.url import build_absolute_url
from app.utilities.models.short_link import ShortLink


class ShortLinkDetailResponseSerializer(serializers.ModelSerializer[ShortLink]):
    """Dữ liệu quản lý link và trạng thái bảo vệ."""

    short_url = serializers.SerializerMethodField(help_text="URL ngắn tuyệt đối.")
    effective_status = serializers.SerializerMethodField(
        help_text="EXPIRED khi quá expires_at; ngược lại status."
    )
    has_password = serializers.SerializerMethodField(help_text="Link có mật khẩu không.")

    class Meta:
        model = ShortLink
        fields = (
            "id",
            "owner_id",
            "name",
            "slug",
            "destination_url",
            "description",
            "auto_redirect_seconds",
            "has_password",
            "status",
            "effective_status",
            "expires_at",
            "short_url",
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

    def get_has_password(self, obj: ShortLink) -> bool:
        """Không bao giờ trả mã băm mật khẩu."""
        return bool(obj.password_hash)
