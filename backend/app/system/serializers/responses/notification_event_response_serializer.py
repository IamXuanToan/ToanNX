"""Response sự kiện thông báo người dùng được nhận."""

from typing import Any

from rest_framework import serializers


class NotificationEventResponseSerializer(serializers.Serializer[Any]):
    """Định nghĩa sự kiện (từ `ModuleDescriptor.notification_events`)."""

    code = serializers.CharField(help_text="Mã sự kiện.")
    module = serializers.CharField(help_text="Module.")
    name = serializers.CharField(help_text="Tên.")
    description = serializers.CharField(help_text="Khi nào phát.")
    scope = serializers.CharField(help_text="PERSONAL / SYSTEM.")
    default_level = serializers.CharField(help_text="Mức mặc định.")
    default_channels = serializers.ListField(child=serializers.CharField(), help_text="Kênh bật sẵn.")
    kind = serializers.CharField(help_text="business / technical.")
