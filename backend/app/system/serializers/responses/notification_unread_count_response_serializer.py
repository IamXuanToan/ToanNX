"""Response số thông báo chưa đọc theo tab."""

from rest_framework import serializers


class NotificationUnreadCountResponseSerializer(serializers.Serializer[dict[str, int]]):
    """Số chưa đọc tab Cá nhân và Hệ thống."""

    personal = serializers.IntegerField(help_text="Chưa đọc tab Cá nhân.")
    system = serializers.IntegerField(help_text="Chưa đọc tab Hệ thống.")
