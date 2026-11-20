"""Model thể loại truyện."""

from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class Genre(JournalTracker, CoreModel):
    """Thể loại truyện (Tiên hiệp, Huyền huyễn, Đô thị...)."""

    name = models.CharField(
        max_length=100,
        verbose_name="Tên thể loại",
        help_text="Tên thể loại truyện.",
        db_comment="Tên thể loại truyện",
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        verbose_name="Đường dẫn tĩnh",
        help_text="Slug định danh thể loại trên URL.",
        db_comment="Slug định danh thể loại",
    )
    description = models.TextField(
        blank=True,
        default="",
        verbose_name="Mô tả",
        help_text="Mô tả chi tiết thể loại.",
        db_comment="Mô tả thể loại",
    )

    class Meta:
        db_table = "novel_genre"
        verbose_name = "Thể loại"
        verbose_name_plural = "Thể loại"
        ordering = ("name",)

    def __str__(self) -> str:
        return self.name
