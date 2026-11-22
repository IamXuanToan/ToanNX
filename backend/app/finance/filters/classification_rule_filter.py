"""Bộ lọc quy tắc nhận diện."""

import django_filters

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.finance.models.classification_rule import ClassificationRule


class ClassificationRuleFilter(django_filters.FilterSet):
    """Nền tảng, đang bật."""

    platform = CoreUUIDInFilter(field_name="platform_id", help_text="Nền tảng; nhiều giá trị.")
    is_active = CoreBooleanInFilter(help_text="Đang bật.")

    class Meta:
        model = ClassificationRule
        fields = ("platform", "is_active")
