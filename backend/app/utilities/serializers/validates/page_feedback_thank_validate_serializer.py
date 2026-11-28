"""Validate gửi email cảm ơn người góp ý."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class PageFeedbackThankValidateSerializer(CoreValidateSerializer):
    """Chọn mẫu email hoặc tùy chỉnh tiêu đề/nội dung gửi lời cảm ơn."""

    template_id = serializers.UUIDField(required=False, allow_null=True)
    subject = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    html_body = serializers.CharField(required=False, allow_blank=True, default="")
    resolution_note = serializers.CharField(max_length=1000, required=False, allow_blank=True)
