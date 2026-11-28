"""Validate đổi trạng thái hàng loạt EmailTemplate."""

from rest_framework import serializers

from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer
from app.system.models.email_template import EmailTemplate


class EmailTemplateBulkUpdateValidateSerializer(CoreBulkIdsValidateSerializer):
    """Danh sách ID và trạng thái mới cho thao tác hàng loạt."""

    status = serializers.ChoiceField(choices=EmailTemplate.Status.choices)
