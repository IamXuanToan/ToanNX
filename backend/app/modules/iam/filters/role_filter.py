"""Bộ lọc danh sách vai trò (django-filter)."""

import django_filters

from app.modules.iam.models.role import Role
from app.modules.iam.models.role_auto_grant import RoleAutoGrant


class RoleFilter(django_filters.FilterSet):
    """`?is_active=true&is_system=false&auto_grant=none`."""

    is_active = django_filters.BooleanFilter(help_text="Lọc theo trạng thái hoạt động.")
    is_system = django_filters.BooleanFilter(help_text="Lọc vai trò hệ thống.")
    auto_grant = django_filters.ChoiceFilter(
        choices=RoleAutoGrant.choices, help_text="Lọc theo chính sách tự cấp quyền (none/all/read_only)."
    )

    class Meta:
        model = Role
        fields = ("is_active", "is_system", "auto_grant")
