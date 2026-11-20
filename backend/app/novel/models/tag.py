"""Model thẻ / hashtag truyện."""

from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class Tag(JournalTracker, CoreModel):
    """Hashtag hoặc nhãn phân loại bổ sung cho truyện."""

    name = models.CharField(
        max_length=100,
        verbose_name="Tên thẻ",
        help_text="Tên hashtag/thẻ truyện.",
        db_comment="Tên hashtag",
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        verbose_name="Đường dẫn tĩnh",
        help_text="Slug định danh thẻ trên URL.",
        db_comment="Slug định danh thẻ",
    )

    class Meta:
        db_table = "novel_tag"
        verbose_name = "Thẻ"
        verbose_name_plural = "Thẻ"
        ordering = ("name",)

    def __str__(self) -> str:
        return self.name
