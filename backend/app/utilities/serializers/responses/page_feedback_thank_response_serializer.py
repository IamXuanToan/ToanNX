"""Response sau khi gửi email cảm ơn người góp ý."""

from rest_framework import serializers


class PageFeedbackThankResponseSerializer(serializers.Serializer):
    """Trạng thái gửi email cảm ơn và mốc thời gian cập nhật."""

    sent = serializers.BooleanField()
    thanked_at = serializers.DateTimeField()
    recipient = serializers.EmailField()
