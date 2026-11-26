"""Validate đổi trạng thái hoàn thành hàng loạt cho Nhắc việc."""

from rest_framework import serializers

from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer


class ReminderBulkUpdateValidateSerializer(CoreBulkIdsValidateSerializer):
    """Đánh dấu hoàn thành / chưa hoàn thành nhiều nhắc việc."""

    is_completed = serializers.BooleanField(help_text="Trạng thái hoàn thành mới (`true`/`false`).")
