"""Thư mục logic trong thư viện; không tham gia vào đường dẫn storage."""

from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models.functions import Lower

from app.core.models.core_model import CoreModel


class AttachmentFolder(CoreModel):
    """Cây thư mục logic, chủ sở hữu là created_by."""

    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="children",
        verbose_name="Thư mục cha",
        help_text="Cha cùng chủ sở hữu; null là thư mục gốc.",
        db_comment="Thư mục cha logic",
    )
    ancestor_ids = ArrayField(
        models.UUIDField(help_text="ID thư mục tổ tiên."),
        default=list,
        blank=True,
        verbose_name="Các tổ tiên",
        help_text="ID tổ tiên từ gốc tới cha, phục vụ lọc cả nhánh.",
        db_comment="Đường dẫn tổ tiên logic, không phải đường dẫn storage",
    )

    name = models.CharField(
        max_length=150,
        verbose_name="Tên thư mục",
        help_text="Tên nhóm file trong thư viện; không tạo thư mục vật lý.",
        db_comment="Tên thư mục logic",
    )

    class Meta:
        db_table = "attachment_folder"
        verbose_name = "Thư mục thư viện"
        verbose_name_plural = "Thư mục thư viện"
        constraints = [
            models.UniqueConstraint(
                Lower("name"),
                "created_by",
                condition=models.Q(deleted_at__isnull=True, parent__isnull=True),
                name="uniq_attachment_root_owner_name",
            ),
            models.UniqueConstraint(
                Lower("name"),
                "created_by",
                "parent",
                condition=models.Q(deleted_at__isnull=True, parent__isnull=False),
                name="uniq_attachment_child_owner_name",
            ),
        ]

    def __str__(self) -> str:
        """Tên hiển thị của thư mục."""
        return self.name
