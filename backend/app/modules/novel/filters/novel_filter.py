"""Bộ lọc danh sách truyện."""

import django_filters

from app.core.filters.core_boolean_in_filter import CoreBooleanInFilter
from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.modules.novel.models.novel import Novel, NovelStatus


class NovelFilter(django_filters.FilterSet):
    """Bộ lọc cho Novel: status, is_published, author, genres, tags."""

    status = CoreChoiceInFilter(
        choices=NovelStatus.choices, help_text="Lọc theo trạng thái: ONGOING, COMPLETED, PAUSED."
    )
    is_published = CoreBooleanInFilter(
        field_name="is_published", help_text="Lọc theo cờ xuất bản (true, false)."
    )
    author = CoreUUIDInFilter(field_name="author_id", help_text="Lọc theo ID tác giả.")
    genre = CoreUUIDInFilter(field_name="genres__id", help_text="Lọc theo ID thể loại.")
    tag = CoreUUIDInFilter(field_name="tags__id", help_text="Lọc theo ID thẻ.")

    class Meta:
        model = Novel
        fields = ("status", "is_published", "author", "genre", "tag")
