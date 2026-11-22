"""Gửi thông báo hệ thống."""

from typing import Any

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.system.constants.notification_level import NotificationLevel
from app.system.models.system_announcement import SystemAnnouncement


class SystemAnnouncementValidateSerializer(CoreValidateSerializer):
    """Tiêu đề, nội dung, mức, đường dẫn nội bộ, đối tượng."""

    title = serializers.CharField(max_length=200, help_text="Tiêu đề.")
    body = serializers.CharField(required=False, allow_blank=True, default="", help_text="Nội dung.")
    level = serializers.ChoiceField(
        choices=NotificationLevel.choices, default=NotificationLevel.INFO, help_text="Mức."
    )
    link = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        default="",
        help_text="Đường dẫn FE (bắt đầu bằng /).",
    )
    target = serializers.ChoiceField(choices=SystemAnnouncement.Target.choices, help_text="ALL / ROLES.")
    role_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, default=list, help_text="Vai trò nhận."
    )
    expires_at = serializers.DateTimeField(
        required=False, allow_null=True, default=None, help_text="Hết hạn."
    )

    def validate_link(self, value: str) -> str:
        """Chỉ đường dẫn nội bộ (chống chuyển hướng ra ngoài)."""
        if value and (not value.startswith("/") or value.startswith("//")):
            raise serializers.ValidationError("Đường dẫn phải bắt đầu bằng /.")
        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """Theo vai trò thì phải chọn ít nhất một vai trò."""
        if attrs["target"] == SystemAnnouncement.Target.ROLES and not attrs.get("role_ids"):
            raise serializers.ValidationError({"role_ids": "Chọn ít nhất một vai trò."})
        return attrs
