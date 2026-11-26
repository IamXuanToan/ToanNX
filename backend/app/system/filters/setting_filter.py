"""Bộ lọc danh sách cấu hình hệ thống (django-filter): `?category=auth,assistant&is_public=true`."""

import django_filters

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.core.filters.core_char_in_filter import CoreCharInFilter
from app.system.models.setting import Setting


class SettingFilter(django_filters.FilterSet):
    """Lọc cấu hình hệ thống theo nhóm (`category`) và trạng thái công khai (`is_public`)."""

    category = CoreCharInFilter(help_text="Nhóm cấu hình (vd: auth, assistant); nhiều giá trị.")
    is_public = CoreBooleanInFilter(help_text="Công khai ra public-settings; nhiều giá trị.")

    class Meta:
        model = Setting
        fields = ("category", "is_public")
