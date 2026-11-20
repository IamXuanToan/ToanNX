"""Model tác giả truyện."""

from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class Author(JournalTracker, CoreModel):
    """Tác giả của các bộ truyện."""

    name = models.CharField(
        max_length=255,
        verbose_name="Tên tác giả",
        help_text="Tên hoặc bút danh của tác giả.",
        db_comment="Tên tác giả",
    )
    slug = models.SlugField(
        max_length=255,
        unique=True,
        verbose_name="Đường dẫn tĩnh",
        help_text="Slug định danh tác giả trên URL.",
        db_comment="Slug định danh tác giả",
    )
    bio = models.TextField(
        blank=True,
        default="",
        verbose_name="Tiểu sử",
        help_text="Giới thiệu về tác giả.",
        db_comment="Tiểu sử tác giả",
    )
    avatar = models.ForeignKey(
        "attachment.Attachment",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Ảnh đại diện",
        help_text="File ảnh lưu ở module attachment.",
        db_comment="Ảnh đại diện tác giả",
    )

    class Meta:
        db_table = "novel_author"
        verbose_name = "Tác giả"
        verbose_name_plural = "Tác giả"
        ordering = ("name",)

    def __str__(self) -> str:
        return self.name
