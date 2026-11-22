"""Bộ lọc nhật ký gửi thông báo."""

import django_filters

from app.core.filters.core_char_in_filter import CoreCharInFilter
from app.system.models.notification_delivery import NotificationDelivery


class NotificationDeliveryFilter(django_filters.FilterSet):
    """Lọc theo trạng thái, kênh, sự kiện (nhiều giá trị, phân tách dấu phẩy)."""

    status = CoreCharInFilter(help_text="Trạng thái; nhiều giá trị.")
    channel = CoreCharInFilter(help_text="Kênh; nhiều giá trị.")
    event_code = CoreCharInFilter(field_name="notification__event_code", help_text="Sự kiện; nhiều giá trị.")

    class Meta:
        model = NotificationDelivery
        fields = ("status", "channel", "event_code")
