"""Validate body POST /short_links/links/bulk-update."""

from rest_framework import serializers

from app.core.serializers.core_bulk_ids_validate_serializer import CoreBulkIdsValidateSerializer
from app.modules.short_links.models.short_link import ShortLink


class ShortLinkBulkUpdateValidateSerializer(CoreBulkIdsValidateSerializer):
    """Bật/tắt nhiều link cùng lúc."""

    status = serializers.ChoiceField(choices=ShortLink.Status.choices, help_text="ACTIVE hoặc INACTIVE.")
