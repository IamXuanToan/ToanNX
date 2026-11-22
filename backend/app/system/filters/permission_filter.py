"""Bộ lọc danh mục quyền (django-filter). Mọi bộ lọc nhận nhiều giá trị phân tách bằng dấu phẩy."""

import django_filters

from app.core.filters.core_char_in_filter import CoreCharInFilter
from app.system.models.permission import Permission


class PermissionFilter(django_filters.FilterSet):
    """`?module=iam,account&action=read`."""

    module = CoreCharInFilter(help_text="Mã module, nhiều giá trị: `iam,account`.")
    resource = CoreCharInFilter(help_text="Tài nguyên, nhiều giá trị: `user,role`.")
    action = CoreCharInFilter(help_text="Hành động, nhiều giá trị: `read,update`.")

    class Meta:
        model = Permission
        fields = ("module", "resource", "action")
