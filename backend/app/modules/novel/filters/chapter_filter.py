"""Bộ lọc danh sách chương truyện."""

import django_filters

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.core.filters.core_char_in_filter import CoreCharInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.modules.novel.models.chapter import Chapter


class ChapterFilter(django_filters.FilterSet):
    """Bộ lọc cho Chapter: novel_id, novel_slug, is_published."""

    novel_id = CoreUUIDInFilter(field_name="novel_id", help_text="Lọc theo ID truyện.")
    novel_slug = CoreCharInFilter(field_name="novel__slug", help_text="Lọc theo slug truyện.")
    is_published = CoreBooleanInFilter(
        field_name="is_published", help_text="Lọc theo cờ xuất bản (true, false)."
    )

    class Meta:
        model = Chapter
        fields = ("novel_id", "novel_slug", "is_published")
