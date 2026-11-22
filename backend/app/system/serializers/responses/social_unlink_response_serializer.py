"""Serializer response khi hủy liên kết mạng xã hội thành công."""

from rest_framework import serializers


class SocialUnlinkResponseSerializer(serializers.Serializer):
    """Phản hồi sau khi hủy liên kết thành công."""

    unlinked = serializers.BooleanField(default=True, help_text="Trạng thái hủy liên kết.")
