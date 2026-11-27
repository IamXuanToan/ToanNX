"""Validate đổi trạng thái theo dõi hàng loạt cho Dịch vụ định kỳ."""

from rest_framework import serializers

from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer


class SubscriptionBulkUpdateValidateSerializer(CoreBulkIdsValidateSerializer):
    """Bật/tắt theo dõi nhiều dịch vụ cùng lúc."""

    is_active = serializers.BooleanField(help_text="Trạng thái theo dõi mới (`true`/`false`).")
