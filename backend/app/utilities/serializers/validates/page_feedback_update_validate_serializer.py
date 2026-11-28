"""Validate cập nhật xử lý PageFeedback."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.utilities.models.page_feedback import PageFeedback


class PageFeedbackUpdateValidateSerializer(CoreValidateSerializer):
    """Cập nhật trạng thái hoặc ghi chú xử lý góp ý."""

    status = serializers.ChoiceField(choices=PageFeedback.Status.choices, required=False)
    resolution_note = serializers.CharField(max_length=1000, required=False, allow_blank=True)
