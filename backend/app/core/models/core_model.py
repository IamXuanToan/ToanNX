"""Model trừu tượng gốc: id UUID, timestamps, audit và khả năng soft delete.

Quy ước:
- Audit (`created_by`/`updated_by`/`deleted_by`) do `CoreRepository` gán, KHÔNG gán
  ngầm trong `save()`. Đường ghi khác (`QuerySet.update`, `bulk_update`, migration
  dữ liệu) phải tự truyền giá trị audit.
- Soft delete là tùy chọn: model nào dùng phải tự định nghĩa hành vi (lọc `alive()`).
  Bảng phiên/token/gán quyền xóa cứng.
"""

import uuid
from typing import Any

from django.conf import settings
from django.db import models
from django.utils import timezone

from app.core.models.core_query_set import CoreQuerySet


class CoreModel(models.Model):
    """Model trừu tượng gốc của entity nghiệp vụ."""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name="Mã định danh",
        db_comment="Khóa chính UUID",
        help_text="Định danh UUID do hệ thống sinh, không đổi.",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Thời điểm tạo",
        db_comment="Thời điểm tạo bản ghi",
        help_text="Thời điểm bản ghi được tạo (tự động).",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Thời điểm cập nhật",
        db_comment="Thời điểm cập nhật gần nhất",
        help_text="Thời điểm bản ghi được sửa gần nhất (tự động).",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Người tạo",
        help_text="NULL nếu do hệ thống tạo (migration, lệnh quản trị).",
        db_comment="Người tạo bản ghi",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Người cập nhật",
        db_comment="Người cập nhật gần nhất",
        help_text="Người dùng sửa bản ghi gần nhất; NULL nếu do hệ thống.",
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Thời điểm xóa mềm",
        help_text="Khác NULL nghĩa là bản ghi đã bị xóa mềm.",
        db_comment="Thời điểm xóa mềm",
    )
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Người xóa",
        db_comment="Người thực hiện xóa mềm",
        help_text="Người dùng thực hiện xóa mềm.",
    )

    objects: Any = CoreQuerySet.as_manager()

    class Meta:
        abstract = True

    def mark_deleted(self, actor: Any | None) -> None:
        """Đánh dấu xóa mềm (chưa lưu DB).

        Args:
            actor: Người thực hiện.
        """
        self.deleted_at = timezone.now()
        self.deleted_by = actor
