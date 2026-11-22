"""Response lần chạy gửi outbox."""

from rest_framework import serializers


class NotificationDispatchResponseSerializer(serializers.Serializer[dict[str, int]]):
    """Số bản gửi thành công."""

    sent = serializers.IntegerField(help_text="Số bản gửi thành công.")
