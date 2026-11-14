"""Bộ lọc danh mục quyền (django-filter)."""

import django_filters

from app.modules.iam.models.permission import Permission


class PermissionFilter(django_filters.FilterSet):
    """`?module=iam&action=read`."""

    module = django_filters.CharFilter(help_text="Mã module, ví dụ `iam`.")
    resource = django_filters.CharFilter(help_text="Tài nguyên, ví dụ `user`.")
    action = django_filters.CharFilter(help_text="Hành động, ví dụ `read`.")

    class Meta:
        model = Permission
        fields = ("module", "resource", "action")
