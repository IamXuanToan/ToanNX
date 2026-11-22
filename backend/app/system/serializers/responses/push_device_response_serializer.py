"""Response thiết bị nhận thông báo trình duyệt."""

from rest_framework import serializers

from app.system.models.push_device import PushDevice


class PushDeviceResponseSerializer(serializers.ModelSerializer[PushDevice]):
    """Không trả token đầy đủ."""

    class Meta:
        model = PushDevice
        fields = ("id", "label", "is_active", "last_seen_at", "created_at")
        read_only_fields = fields
