"""Validate gửi góp ý / báo lỗi ẩn danh từ trang công khai Custom Page hoặc ShortLink."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.utilities.models.page_feedback import PageFeedback


class PageFeedbackPublicCreateValidateSerializer(CoreValidateSerializer):
    """Dữ liệu khách vãng lai gửi góp ý/báo lỗi cho Page hoặc ShortLink."""

    target_type = serializers.ChoiceField(choices=PageFeedback.TargetType.choices)
    target_id = serializers.UUIDField(required=False, allow_null=True)
    slug = serializers.CharField(max_length=120, required=False, allow_blank=True, default="")
    target_url = serializers.URLField(max_length=2048)
    target_title = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    target_item_id = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")
    feedback_type = serializers.ChoiceField(
        choices=PageFeedback.FeedbackType.choices,
        required=False,
        default=PageFeedback.FeedbackType.BROKEN_LINK,
    )
    message = serializers.CharField(max_length=2000)
    sender_name = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    sender_email = serializers.EmailField(required=False, allow_blank=True, default="")
    website = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
