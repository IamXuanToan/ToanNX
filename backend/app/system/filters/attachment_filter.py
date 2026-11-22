"""Bộ lọc danh sách file (django-filter)."""

from uuid import UUID

import django_filters
from django.db.models import Q, QuerySet
from rest_framework.exceptions import ValidationError

from app.core.filters.core_char_in_filter import CoreCharInFilter
from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.core.filters.core_uuid_in_filter import CoreUUIDInFilter
from app.system.constants.media_types import CONTENT_TYPES_BY_KIND, MEDIA_KINDS, UNFILED_FOLDER
from app.system.models.attachment import Attachment


class AttachmentFilter(django_filters.FilterSet):
    """`?content_type=image/png`."""

    content_type = CoreCharInFilter(help_text="MIME type; nhận nhiều giá trị phân tách dấu phẩy.")
    kind = CoreChoiceInFilter(
        choices=MEDIA_KINDS,
        method="filter_kind",
        help_text="Loại file: IMAGE, VIDEO, DOCUMENT; nhận nhiều giá trị.",
    )
    folder = CoreCharInFilter(
        method="filter_folder", help_text="Id thư mục hoặc UNFILED; nhận nhiều giá trị phân tách dấu phẩy."
    )
    scope = CoreChoiceInFilter(
        choices=(("MINE", "Của tôi"), ("OTHERS", "Của người khác")),
        method="filter_scope",
        help_text="MINE, OTHERS; không mở rộng phạm vi quyền của người dùng.",
    )
    visibility = CoreChoiceInFilter(
        choices=Attachment.Visibility.choices,
        help_text="Chế độ xem: public, private; nhận nhiều giá trị.",
    )
    created_by = CoreUUIDInFilter(
        field_name="created_by_id",
        help_text="UUID người tạo tệp; nhận nhiều giá trị phân tách dấu phẩy.",
    )

    def filter_kind(
        self, queryset: QuerySet[Attachment], name: str, values: list[str]
    ) -> QuerySet[Attachment]:
        """Kết hợp OR các loại được chọn trên queryset đã giới hạn quyền."""
        content_types = [content_type for kind in values for content_type in CONTENT_TYPES_BY_KIND[kind]]
        return queryset.filter(content_type__in=content_types)

    def filter_folder(
        self, queryset: QuerySet[Attachment], name: str, values: list[str]
    ) -> QuerySet[Attachment]:
        """Kết hợp nhóm cụ thể và chưa phân loại; không mở rộng queryset owner."""
        ids = []
        for value in values:
            if value == UNFILED_FOLDER:
                continue
            try:
                ids.append(UUID(value))
            except ValueError as exc:
                raise ValidationError({"folder": ["Mã thư mục không hợp lệ."]}) from exc
        condition = Q(folder_id__in=ids) | Q(folder__ancestor_ids__overlap=ids)
        if UNFILED_FOLDER in values:
            condition |= Q(folder__isnull=True)
        return queryset.filter(condition)

    def filter_scope(
        self, queryset: QuerySet[Attachment], name: str, values: list[str]
    ) -> QuerySet[Attachment]:
        """Chỉ lọc thu hẹp; không mở rộng quyền truy cập file của người khác."""
        if len(values) != 1 or self.request is None:
            return queryset
        own = Q(created_by_id=self.request.user.pk)
        return queryset.filter(own if values[0] == "MINE" else ~own)

    class Meta:
        model = Attachment
        fields = ("content_type", "kind", "scope", "folder", "visibility", "created_by")
