"""Bộ lọc phiên đăng nhập quản trị. Mọi bộ lọc nhận nhiều giá trị phân tách bằng dấu phẩy."""

import django_filters
from django.db.models import Q, QuerySet
from django.utils import timezone

from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.modules.authentication.models.auth_session import AuthSession
from app.modules.authentication.models.auth_session_status import AuthSessionStatus


class AdminAuthSessionFilter(django_filters.FilterSet):
    """`?user=<uuid>,<uuid>&status=ACTIVE,EXPIRED`."""

    user = CoreUUIDInFilter(field_name="user_id", help_text="UUID người dùng, nhiều giá trị.")
    status = CoreChoiceInFilter(
        choices=AuthSessionStatus.choices,
        method="filter_status",
        help_text="Trạng thái thực tế, nhiều giá trị: `ACTIVE,REVOKED,EXPIRED`.",
    )

    def filter_status(
        self, queryset: QuerySet[AuthSession], name: str, value: list[str]
    ) -> QuerySet[AuthSession]:
        """Gộp (OR) điều kiện của từng trạng thái đã chọn; giá trị lạ bị bỏ qua.

        Args:
            queryset: Queryset phiên.
            name: Tên bộ lọc.
            value: Các trạng thái đã chọn.

        Returns:
            Queryset đã lọc.
        """
        now = timezone.now()
        conditions = {
            AuthSessionStatus.REVOKED: Q(revoked_at__isnull=False),
            AuthSessionStatus.EXPIRED: Q(revoked_at__isnull=True, expires_at__lte=now),
            AuthSessionStatus.ACTIVE: Q(revoked_at__isnull=True, expires_at__gt=now),
        }
        combined = Q()
        matched = False
        for item in dict.fromkeys(value):
            if item in conditions:
                combined |= conditions[AuthSessionStatus(item)]
                matched = True
        return queryset.filter(combined) if matched else queryset.none()

    class Meta:
        model = AuthSession
        fields = ("user", "status")
