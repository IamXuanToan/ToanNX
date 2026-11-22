"""Bộ lọc liên kết rút gọn: `?status=ACTIVE,EXPIRED&owner=<uuid>,<uuid>`."""

from typing import Any

import django_filters
from django.db.models import Q, QuerySet
from django.utils import timezone

from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.utilities.models.short_link import ShortLink

EXPIRED = "EXPIRED"
STATUS_CHOICES = (*ShortLink.Status.choices, (EXPIRED, "Hết hạn"))


class ShortLinkFilter(django_filters.FilterSet):
    """Trạng thái hiệu lực (EXPIRED suy từ `expires_at`) và chủ sở hữu."""

    status = CoreChoiceInFilter(
        choices=STATUS_CHOICES, method="filter_status", help_text="Nhiều giá trị: ACTIVE, INACTIVE, EXPIRED."
    )
    owner = CoreUUIDInFilter(
        field_name="owner_id", help_text="Id chủ sở hữu (chỉ có tác dụng với manage_all)."
    )

    class Meta:
        model = ShortLink
        fields = ("status", "owner")

    @staticmethod
    def filter_status(queryset: QuerySet[ShortLink], name: str, value: Any) -> QuerySet[ShortLink]:
        """Gộp OR các trạng thái đã chọn; ACTIVE/INACTIVE chỉ tính link chưa hết hạn.

        Args:
            queryset: Queryset.
            name: Tên filter.
            value: Danh sách trạng thái.

        Returns:
            Queryset đã lọc.
        """
        if not value:
            return queryset
        now = timezone.now()
        alive = Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        conditions = {
            ShortLink.Status.ACTIVE: alive & Q(status=ShortLink.Status.ACTIVE),
            ShortLink.Status.INACTIVE: alive & Q(status=ShortLink.Status.INACTIVE),
            EXPIRED: Q(expires_at__lte=now),
        }
        query = Q()
        for item in dict.fromkeys(value):
            query |= conditions[item]
        return queryset.filter(query)
