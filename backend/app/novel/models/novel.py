"""Model truyện tiểu thuyết."""

from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class NovelStatus(models.TextChoices):
    """Trạng thái phát hành của truyện."""

    ONGOING = "ONGOING", "Đang ra"
    COMPLETED = "COMPLETED", "Hoàn thành"
    PAUSED = "PAUSED", "Tạm dừng"


class Novel(JournalTracker, CoreModel):
    """Truyện tiểu thuyết."""

    title = models.CharField(
        max_length=255,
        verbose_name="Tiêu đề truyện",
        help_text="Tên truyện chính thức.",
        db_comment="Tên truyện",
    )
    slug = models.SlugField(
        max_length=255,
        unique=True,
        verbose_name="Đường dẫn tĩnh",
        help_text="Slug định danh truyện trên URL.",
        db_comment="Slug định danh truyện",
    )
    original_title = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Tên gốc",
        help_text="Tên gốc của truyện nếu là tác phẩm dịch.",
        db_comment="Tên gốc",
    )
    author = models.ForeignKey(
        "novel.Author",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="novels",
        verbose_name="Tác giả",
        db_comment="Tác giả của truyện",
    )
    thumbnail = models.ForeignKey(
        "system.Attachment",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Ảnh bìa truyện",
        help_text="Ảnh bìa đại diện cho truyện.",
        db_comment="Ảnh bìa truyện",
    )
    description = models.TextField(
        blank=True,
        default="",
        verbose_name="Giới thiệu",
        help_text="Tóm tắt nội dung truyện.",
        db_comment="Giới thiệu truyện",
    )
    status = models.CharField(
        max_length=20,
        choices=NovelStatus.choices,
        default=NovelStatus.ONGOING,
        verbose_name="Trạng thái",
        help_text="Tình trạng phát hành của truyện.",
        db_comment="Trạng thái truyện",
    )
    genres = models.ManyToManyField(
        "novel.Genre",
        blank=True,
        related_name="novels",
        verbose_name="Thể loại",
    )
    tags = models.ManyToManyField(
        "novel.Tag",
        blank=True,
        related_name="novels",
        verbose_name="Thẻ / Hashtag",
    )
    views_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Lượt xem",
        db_comment="Tổng số lượt xem truyện",
    )
    favorites_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Lượt thích",
        db_comment="Tổng số lượt thích truyện",
    )
    is_published = models.BooleanField(
        default=True,
        verbose_name="Đã xuất bản",
        help_text="Cho phép người dùng đọc truyện.",
        db_comment="Cho phép người dùng đọc",
    )
    owner = models.ForeignKey(
        "system.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="novels",
        verbose_name="Người đăng",
        db_comment="Người tạo hoặc quản lý truyện",
    )

    class Meta:
        db_table = "novel_novel"
        verbose_name = "Truyện"
        verbose_name_plural = "Truyện"
        ordering = ("-created_at", "-pk")

    def __str__(self) -> str:
        return self.title
