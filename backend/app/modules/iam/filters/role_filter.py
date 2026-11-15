"""Bộ lọc danh sách vai trò (django-filter). Mọi bộ lọc nhận nhiều giá trị phân tách bằng dấu phẩy."""

import django_filters

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.modules.iam.models.role import Role
from app.modules.iam.models.role_auto_grant import RoleAutoGrant


class RoleFilter(django_filters.FilterSet):
    """`?is_active=true&is_system=false&auto_grant=none,read_only`."""

    is_active = CoreBooleanInFilter(help_text="Trạng thái hoạt động, nhiều giá trị: `true,false`.")
    is_system = CoreBooleanInFilter(help_text="Vai trò hệ thống, nhiều giá trị: `true,false`.")
    auto_grant = CoreChoiceInFilter(
        choices=RoleAutoGrant.choices,
        help_text="Chính sách tự cấp quyền, nhiều giá trị: `none,all,read_only`.",
    )

    class Meta:
        model = Role
        fields = ("is_active", "is_system", "auto_grant")
