"""Validate sửa liên kết rút gọn."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.modules.short_links.models.short_link import ShortLink


class ShortLinkUpdateValidateSerializer(CoreValidateSerializer):
    """Các trường được phép sửa."""

    name = serializers.CharField(required=False, max_length=150, help_text="Tên link.")
    slug = serializers.CharField(required=False, max_length=64, help_text="Slug mới; URL cũ trả 404.")
    destination_url = serializers.URLField(required=False, max_length=2048, help_text="URL HTTP/HTTPS đích.")
    description = serializers.CharField(required=False, allow_blank=True, max_length=1000, help_text="Mô tả.")
    redirect_type = serializers.ChoiceField(
        required=False, choices=ShortLink.RedirectType.choices, help_text="301 hoặc 302."
    )
    status = serializers.ChoiceField(
        required=False, choices=ShortLink.Status.choices, help_text="ACTIVE hoặc INACTIVE."
    )
    expires_at = serializers.DateTimeField(required=False, allow_null=True, help_text="Thời điểm hết hạn.")
