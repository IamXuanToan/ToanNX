"""Validate đổi trạng thái hàng loạt PageFeedback."""

from rest_framework import serializers

from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer
from app.utilities.models.page_feedback import PageFeedback


class PageFeedbackBulkUpdateValidateSerializer(CoreBulkIdsValidateSerializer):
    """Danh sách ID và trạng thái mới cho thao tác hàng loạt."""

    status = serializers.ChoiceField(choices=PageFeedback.Status.choices)
