"""Bộ lọc cho danh sách Language."""

import django_filters

from app.system.models.language import Language


class LanguageFilter(django_filters.FilterSet):
    """Lọc ngôn ngữ theo trạng thái bật/tắt và cờ mặc định."""

    is_active = django_filters.BooleanFilter(field_name="is_active")
    is_default = django_filters.BooleanFilter(field_name="is_default")

    class Meta:
        """Khai báo model và trường lọc."""

        model = Language
        fields = ("is_active", "is_default")
