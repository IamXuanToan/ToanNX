"""Đăng ký trình duyệt nhận thông báo."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class PushDeviceValidateSerializer(CoreValidateSerializer):
    """Token FCM lấy từ `getToken` của Firebase."""

    fcm_token = serializers.CharField(max_length=500, help_text="Token FCM.")
    device_label = serializers.CharField(
        max_length=120, required=False, allow_blank=True, default="", help_text="Tên thiết bị."
    )
