"""Bộ lọc danh sách người dùng (django-filter). Mọi bộ lọc nhận nhiều giá trị phân tách bằng dấu phẩy."""

import django_filters
from django.db.models import Q, QuerySet

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.system.models.user import User

ACCESS_CHOICES = (("superuser", "superuser"), ("staff", "staff"), ("novel", "novel"))


class UserFilter(django_filters.FilterSet):
    """`?is_active=true,false&is_staff=true&role=<uuid>,<uuid>`."""

    is_active = CoreBooleanInFilter(help_text="Trạng thái hoạt động, nhiều giá trị: `true,false`.")
    is_staff = CoreBooleanInFilter(help_text="Quyền vào khu vực quản trị, nhiều giá trị: `true,false`.")
    is_superuser = CoreBooleanInFilter(help_text="Superuser, nhiều giá trị: `true,false`.")
    is_novel = CoreBooleanInFilter(help_text="Nhóm Novel, nhiều giá trị: `true,false`.")
    role = CoreUUIDInFilter(
        field_name="user_roles__role_id",
        distinct=True,
        help_text="UUID vai trò đã gán, nhiều giá trị phân tách bằng dấu phẩy (có ít nhất một).",
    )
    access = CoreChoiceInFilter(
        choices=ACCESS_CHOICES,
        method="filter_access",
        help_text="Loại truy cập, nhiều giá trị (khớp một trong các loại): `superuser,staff,novel`.",
    )

    def filter_access(self, queryset: QuerySet[User], name: str, value: list[str]) -> QuerySet[User]:
        """Gộp (OR) các loại truy cập đã chọn.

        Args:
            queryset: Queryset người dùng.
            name: Tên bộ lọc.
            value: Các loại đã chọn.

        Returns:
            Queryset đã lọc.
        """
        conditions = {
            "superuser": Q(is_superuser=True),
            "staff": Q(is_staff=True, is_superuser=False),
            "novel": Q(is_novel=True),
        }
        combined = Q()
        for item in dict.fromkeys(value):
            combined |= conditions[item]
        return queryset.filter(combined) if value else queryset

    class Meta:
        model = User
        fields = ("is_active", "is_staff", "is_superuser", "is_novel", "role", "access")
