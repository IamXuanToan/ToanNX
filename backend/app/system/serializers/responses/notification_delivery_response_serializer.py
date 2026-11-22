"""Response lần gửi thông báo."""

from rest_framework import serializers

from app.system.models.notification_delivery import NotificationDelivery


class NotificationDeliveryResponseSerializer(serializers.ModelSerializer[NotificationDelivery]):
    """Lần gửi + tóm tắt thông báo; đích email/Telegram/thiết bị được rút gọn."""

    event_code = serializers.CharField(source="notification.event_code", read_only=True, help_text="Sự kiện.")
    title = serializers.CharField(source="notification.title", read_only=True, help_text="Tiêu đề.")
    level = serializers.CharField(source="notification.level", read_only=True, help_text="Mức.")
    recipient_id = serializers.UUIDField(
        source="notification.recipient_id", read_only=True, help_text="Người nhận."
    )
    recipient_name = serializers.CharField(
        source="notification.recipient.display_name", read_only=True, help_text="Tên người nhận."
    )

    class Meta:
        model = NotificationDelivery
        fields = (
            "id",
            "event_code",
            "title",
            "level",
            "recipient_id",
            "recipient_name",
            "channel",
            "target",
            "status",
            "attempts",
            "next_attempt_at",
            "last_error_code",
            "sent_at",
            "created_at",
        )
        read_only_fields = fields
