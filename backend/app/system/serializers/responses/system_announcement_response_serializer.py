"""Response thông báo hệ thống."""

from rest_framework import serializers

from app.system.models.role import Role
from app.system.models.system_announcement import SystemAnnouncement


class SystemAnnouncementResponseSerializer(serializers.ModelSerializer[SystemAnnouncement]):
    """Thông báo hệ thống đã gửi."""

    role_ids: serializers.PrimaryKeyRelatedField[Role] = serializers.PrimaryKeyRelatedField(
        source="roles", many=True, read_only=True, help_text="Vai trò nhận."
    )

    class Meta:
        model = SystemAnnouncement
        fields = (
            "id",
            "title",
            "body",
            "level",
            "link",
            "target",
            "role_ids",
            "expires_at",
            "sent_at",
            "recipient_count",
            "created_at",
        )
        read_only_fields = fields
