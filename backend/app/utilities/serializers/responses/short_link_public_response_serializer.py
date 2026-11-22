"""Dữ liệu công khai cho trang trung gian của link ngắn."""

from rest_framework import serializers

from app.utilities.models.short_link import ShortLink


class ShortLinkPublicResponseSerializer(serializers.ModelSerializer[ShortLink]):
    """Không tiết lộ URL đích của link đang khóa."""

    has_password = serializers.SerializerMethodField(help_text="Link có yêu cầu mật khẩu không.")
    destination_url = serializers.SerializerMethodField(
        help_text="URL đích khi link không khóa; null nếu khóa."
    )

    class Meta:
        model = ShortLink
        fields = ("name", "description", "destination_url", "has_password", "auto_redirect_seconds")
        read_only_fields = fields

    def get_has_password(self, obj: ShortLink) -> bool:
        """Cho biết có khóa mà không lộ mã băm."""
        return bool(obj.password_hash)

    def get_destination_url(self, obj: ShortLink) -> str | None:
        """Chỉ tiết lộ đích khi không cần mật khẩu."""
        return obj.destination_url if not obj.password_hash else None
