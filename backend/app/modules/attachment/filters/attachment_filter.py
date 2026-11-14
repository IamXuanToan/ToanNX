"""Bộ lọc danh sách file (django-filter)."""

import django_filters

from app.modules.attachment.models.attachment import Attachment


class AttachmentFilter(django_filters.FilterSet):
    """`?content_type=image/png`."""

    content_type = django_filters.CharFilter(help_text="MIME type đã xác minh, ví dụ `image/png`.")

    class Meta:
        model = Attachment
        fields = ("content_type",)
