"""Validate body POST /utilities/donations/bulk-update."""

from rest_framework import serializers

from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer


class DonationBulkUpdateValidateSerializer(CoreBulkIdsValidateSerializer):
    """Cập nhật cờ `is_hidden` của nhiều bản ghi quyên góp cùng lúc."""

    is_hidden = serializers.BooleanField(help_text="Cờ ẩn hoặc hiện bình luận trên trang công khai.")
