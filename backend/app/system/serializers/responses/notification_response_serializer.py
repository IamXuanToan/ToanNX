"""Response thông báo trong chuông."""

from rest_framework import serializers

from app.system.models.notification import Notification


class NotificationResponseSerializer(serializers.ModelSerializer[Notification]):
    """Một thông báo; FE dịch `message_key` + `params`, thiếu khóa thì dùng `title`/`body`."""

    class Meta:
        model = Notification
        fields = (
            "id",
            "scope",
            "level",
            "event_code",
            "module",
            "title",
            "body",
            "message_key",
            "params",
            "link",
            "data",
            "read_at",
            "created_at",
        )
        read_only_fields = fields
