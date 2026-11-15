"""Response quản lý liên kết rút gọn."""

from django.utils import timezone
from rest_framework import serializers

from app.core.utils.url import build_absolute_url
from app.modules.short_links.models.short_link import ShortLink


class ShortLinkDetailResponseSerializer(serializers.ModelSerializer[ShortLink]):
    """Dữ liệu quản lý link, gồm trạng thái hiệu lực và cảnh báo cache 301."""

    short_url = serializers.SerializerMethodField(help_text="URL ngắn tuyệt đối.")
    effective_status = serializers.SerializerMethodField(
        help_text="EXPIRED khi quá expires_at; ngược lại status."
    )
    redirect_warning = serializers.SerializerMethodField(help_text="Cảnh báo nếu dùng 301.")

    class Meta:
        model = ShortLink
        fields = (
            "id",
            "owner_id",
            "name",
            "slug",
            "destination_url",
            "description",
            "redirect_type",
            "status",
            "effective_status",
            "expires_at",
            "short_url",
            "redirect_warning",
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

    def get_redirect_warning(self, obj: ShortLink) -> str | None:
        """Báo trước cache lâu của redirect 301."""
        return (
            "301 có thể được trình duyệt hoặc CDN lưu cache; đổi URL đích sẽ không có hiệu lực ngay."
            if obj.redirect_type == 301
            else None
        )
