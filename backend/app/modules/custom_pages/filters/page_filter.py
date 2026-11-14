"""Bộ lọc danh sách trang."""

import django_filters

from app.modules.custom_pages.models.page import Page


class PageFilter(django_filters.FilterSet):
    """Lọc theo trạng thái trang."""

    status = django_filters.ChoiceFilter(
        choices=Page.Status.choices, help_text="DRAFT, PUBLISHED hoặc UNPUBLISHED."
    )

    class Meta:
        model = Page
        fields = ("status",)
