"""Validate body của thao tác hàng loạt theo danh sách id."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer

BULK_MAX_ITEMS = 100


class CoreBulkIdsValidateSerializer(CoreValidateSerializer):
    """Danh sách id bản ghi (1–100, không trùng) cho thao tác hàng loạt."""

    ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        max_length=BULK_MAX_ITEMS,
        help_text=f"Id các bản ghi cần thao tác (tối đa {BULK_MAX_ITEMS}).",
    )

    def validate_ids(self, value: list[object]) -> list[object]:
        """Bỏ id trùng, giữ thứ tự.

        Args:
            value: Danh sách id.

        Returns:
            Danh sách id không trùng.
        """
        return list(dict.fromkeys(value))
