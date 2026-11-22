"""Query danh sách chuông."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer
from app.system.constants.notification_scope import NotificationScope


class NotificationListValidateSerializer(CoreValidateSerializer):
    """Lọc theo tab, chỉ chưa đọc."""

    scope = serializers.ChoiceField(choices=NotificationScope.choices, required=False, help_text="Tab.")
    unread = serializers.BooleanField(required=False, default=False, help_text="Chỉ chưa đọc.")
    page = serializers.IntegerField(required=False, min_value=1, help_text="Trang.")
    page_size = serializers.IntegerField(
        required=False, min_value=1, max_value=100, help_text="Số dòng mỗi trang."
    )
