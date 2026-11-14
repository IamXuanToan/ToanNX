"""QuerySet dùng chung cho model kế thừa CoreModel."""

from typing import Self

from django.db import models


class CoreQuerySet[M: models.Model](models.QuerySet[M]):
    """QuerySet có tiện ích lọc theo trạng thái soft delete (tường minh, không ẩn ngầm)."""

    def alive(self) -> Self:
        """Lọc bản ghi chưa bị xóa mềm.

        Returns:
            QuerySet đã lọc.
        """
        return self.filter(deleted_at__isnull=True)
