"""Validate tạo liên kết rút gọn."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.modules.short_links.models.short_link import ShortLink


class ShortLinkCreateValidateSerializer(CoreValidateSerializer):
    """Input tạo liên kết; owner lấy từ actor."""

    name = serializers.CharField(max_length=150, help_text="Tên link.")
    slug = serializers.CharField(required=False, max_length=64, help_text="Slug tùy chọn, bỏ qua để tự sinh.")
    destination_url = serializers.URLField(max_length=2048, help_text="URL HTTP/HTTPS đích.")
    description = serializers.CharField(required=False, allow_blank=True, max_length=1000, help_text="Mô tả.")
    redirect_type = serializers.ChoiceField(
        required=False, choices=ShortLink.RedirectType.choices, help_text="301 được cache lâu; mặc định 302."
    )
    status = serializers.ChoiceField(
        required=False, choices=ShortLink.Status.choices, help_text="ACTIVE hoặc INACTIVE."
    )
    expires_at = serializers.DateTimeField(
        required=False, allow_null=True, help_text="Thời điểm hết hạn, null không giới hạn."
    )
