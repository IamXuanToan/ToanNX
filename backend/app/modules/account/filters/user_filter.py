"""Bộ lọc danh sách người dùng (django-filter)."""

import django_filters

from app.modules.account.models.user import User


class UserFilter(django_filters.FilterSet):
    """`?is_active=true&is_staff=false&is_superuser=false&is_novel=true`."""

    is_active = django_filters.BooleanFilter(help_text="Lọc theo trạng thái hoạt động.")
    is_staff = django_filters.BooleanFilter(help_text="Lọc theo quyền vào khu vực quản trị.")
    is_superuser = django_filters.BooleanFilter(help_text="Lọc superuser.")
    is_novel = django_filters.BooleanFilter(help_text="Lọc người dùng thuộc nhóm Novel.")

    class Meta:
        model = User
        fields = ("is_active", "is_staff", "is_superuser", "is_novel")
