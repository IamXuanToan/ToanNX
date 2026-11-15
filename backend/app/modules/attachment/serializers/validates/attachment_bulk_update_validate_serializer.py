"""Hợp đồng chuyển nhiều file vào cùng một thư mục."""

from rest_framework import serializers

from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer


class AttachmentBulkUpdateValidateSerializer(CoreBulkIdsValidateSerializer):
    """Gom nhóm cùng transaction, không sửa byte hoặc URL của các file."""

    folder_id = serializers.UUIDField(allow_null=True, help_text="Thư mục đích hoặc null để bỏ nhóm.")
