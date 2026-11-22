"""Đánh dấu đã đọc tất cả."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.system.constants.notification_scope import NotificationScope


class NotificationReadAllValidateSerializer(CoreValidateSerializer):
    """Theo tab (bỏ trống = mọi tab)."""

    scope = serializers.ChoiceField(choices=NotificationScope.choices, required=False, help_text="Tab.")
