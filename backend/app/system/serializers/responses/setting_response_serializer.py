"""Serializer phản hồi dữ liệu cấu hình hệ thống (Setting)."""

from rest_framework import serializers

from app.system.models.setting import Setting


class SettingResponseSerializer(serializers.ModelSerializer):
    """Thông tin chi tiết một tham số cấu hình hệ thống."""

    class Meta:
        model = Setting
        fields = (
            "id",
            "key",
            "value",
            "description",
            "category",
            "is_public",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
