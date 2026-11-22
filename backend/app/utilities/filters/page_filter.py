"""Bộ lọc trang: `?status=DRAFT,PUBLISHED&path=<uuid>&owner=<uuid>`."""

import django_filters

from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.utilities.models.page import Page


class PageFilter(django_filters.FilterSet):
    """Trạng thái, đường dẫn giữa, chủ sở hữu (chỉ có tác dụng với manage_all)."""

    status = CoreChoiceInFilter(choices=Page.Status.choices, help_text="Nhiều giá trị.")
    path = CoreUUIDInFilter(field_name="path_id", help_text="Id đường dẫn giữa, nhiều giá trị.")
    owner = CoreUUIDInFilter(field_name="owner_id", help_text="Id chủ sở hữu, nhiều giá trị.")

    class Meta:
        model = Page
        fields = ("status", "path", "owner")
