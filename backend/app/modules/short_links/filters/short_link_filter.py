"""Bộ lọc liên kết rút gọn."""

import django_filters

from app.modules.short_links.models.short_link import ShortLink


class ShortLinkFilter(django_filters.FilterSet):
    """Lọc theo trạng thái và kiểu redirect."""

    status = django_filters.ChoiceFilter(choices=ShortLink.Status.choices, help_text="Trạng thái cấu hình.")
    redirect_type = django_filters.ChoiceFilter(
        choices=ShortLink.RedirectType.choices, help_text="301 hoặc 302."
    )

    class Meta:
        model = ShortLink
        fields = ("status", "redirect_type")
