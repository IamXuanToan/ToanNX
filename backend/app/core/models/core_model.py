"""Model trừu tượng gốc: id UUID, timestamps, audit và khả năng soft delete.

Quy ước:
- Audit (`created_by`/`updated_by`/`deleted_by`) do `CoreRepository` gán, KHÔNG gán
  ngầm trong `save()`. Đường ghi khác (`QuerySet.update`, `bulk_update`, migration
  dữ liệu) phải tự truyền giá trị audit.
- Xóa mặc định là **xóa mềm** (`CoreRepository.delete`); queryset gốc của repository tự ẩn bản đã xóa.
  Xóa cứng chỉ khi thực sự cần, gọi tường minh `hard_delete` (token hết hạn, bảng nối gán quyền,
  dữ liệu quá hạn giữ).
- Xóa mềm **giải phóng giá trị unique**: field text unique (`unique=True` hoặc nằm trong `UniqueConstraint`
  không điều kiện, kể cả dạng `Lower("slug")`) được thêm hậu tố `_deleted_<timestamp ms>`, nên tạo lại cùng
  email/mã/slug không vướng bản đã xóa. Ràng buộc có điều kiện `deleted_at IS NULL` thì không cần đổi.
"""

import uuid
from collections.abc import Generator
from typing import Any

from django.conf import settings
from django.db import models
from django.db.models import F, UniqueConstraint
from django.utils import timezone

from app.core.models.core_query_set import CoreQuerySet

DELETED_SUFFIX = "_deleted_"
_UNIQUE_TEXT_FIELDS: dict[type, tuple[str, ...]] = {}


def _field_refs(expression: Any) -> Generator[str]:
    """Tên field được tham chiếu trong biểu thức (`Lower("slug")` → `slug`)."""
    if isinstance(expression, F):
        yield str(getattr(expression, "name", ""))
    for source in getattr(expression, "get_source_expressions", list)():
        yield from _field_refs(source)


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

    @classmethod
    def unique_text_fields(cls) -> tuple[str, ...]:
        """Field text phải đổi khi xóa mềm để giải phóng giá trị unique (cache theo lớp).

        Gồm field `unique=True` và field nằm trong `UniqueConstraint` không có `condition`.

        Returns:
            Tên field.
        """
        cached = _UNIQUE_TEXT_FIELDS.get(cls)
        if cached is not None:
            return cached
        names = {field.name for field in cls._meta.concrete_fields if field.unique and not field.primary_key}
        for constraint in cls._meta.constraints:
            if isinstance(constraint, UniqueConstraint) and constraint.condition is None:
                names.update(constraint.fields)
                for expression in constraint.expressions:
                    names.update(_field_refs(expression))
        result = tuple(
            sorted(name for name in names if isinstance(cls._meta.get_field(name), models.CharField))
        )
        _UNIQUE_TEXT_FIELDS[cls] = result
        return result

    def mark_deleted(self, actor: Any | None) -> list[str]:
        """Đánh dấu xóa mềm (chưa lưu DB) và thêm hậu tố `_deleted_<timestamp>` cho field unique.

        Args:
            actor: Người thực hiện.

        Returns:
            Field unique đã đổi (để đưa vào `update_fields`).
        """
        self.deleted_at = timezone.now()
        self.deleted_by = actor
        suffix = f"{DELETED_SUFFIX}{int(self.deleted_at.timestamp() * 1000)}"
        changed: list[str] = []
        for name in self.unique_text_fields():
            value = getattr(self, name)
            if not value or DELETED_SUFFIX in value:
                continue
            max_length = getattr(self._meta.get_field(name), "max_length", None)
            base = value[: max_length - len(suffix)] if max_length else value
            setattr(self, name, f"{base}{suffix}")
            changed.append(name)
        return changed
