"""Validate POST /utilities/pages/bulk-update."""

from rest_framework import serializers

from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer
from app.utilities.models.page import Page


class PageBulkUpdateValidateSerializer(CoreBulkIdsValidateSerializer):
    """Công khai / ngừng công khai nhiều trang."""

    status = serializers.ChoiceField(choices=Page.Status.choices, help_text="Trạng thái mới.")
