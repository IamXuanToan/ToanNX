"""Validate body POST /iam/roles/bulk-update."""

from rest_framework import serializers

from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer


class RoleBulkUpdateValidateSerializer(CoreBulkIdsValidateSerializer):
    """Bật/tắt nhiều vai trò cùng lúc."""

    is_active = serializers.BooleanField(help_text="true = bật, false = tắt (không cấp quyền).")
