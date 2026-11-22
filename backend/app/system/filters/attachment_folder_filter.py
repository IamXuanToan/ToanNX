"""Bộ lọc thư mục theo người tạo."""

import django_filters
from django.db.models import Q, QuerySet

from app.core.filters.core_choice_in_filter import CoreChoiceInFilter
from app.system.models.attachment_folder import AttachmentFolder


class AttachmentFolderFilter(django_filters.FilterSet):
    """Chỉ lọc thu hẹp queryset mà service đã giới hạn quyền."""

    scope = CoreChoiceInFilter(
        choices=(("MINE", "Của tôi"), ("OTHERS", "Của người khác")),
        method="filter_scope",
        help_text="Phạm vi người tạo, nhận nhiều giá trị.",
    )

    def filter_scope(
        self, queryset: QuerySet[AttachmentFolder], name: str, values: list[str]
    ) -> QuerySet[AttachmentFolder]:
        """Chọn các nhóm do actor tạo hoặc nhóm người khác trong phạm vi cho phép."""
        if len(values) != 1 or self.request is None:
            return queryset
        own = Q(created_by_id=self.request.user.pk)
        return queryset.filter(own if values[0] == "MINE" else ~own)

    class Meta:
        model = AttachmentFolder
        fields = ("scope",)
