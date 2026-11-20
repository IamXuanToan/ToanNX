"""Trang tùy chỉnh: `toannx.com/<path.segment>/<slug>`, nội dung là JSON Tiptap."""

from django.conf import settings
from django.db import models
from django.db.models.functions import Lower

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class Page(JournalTracker, CoreModel):
    """Trang của owner; nội dung soạn bằng Tiptap, lưu JSON (không lưu HTML)."""

    journal_excluded_fields = ("content",)

    class Status(models.TextChoices):
        """Trạng thái xuất bản."""

        DRAFT = "DRAFT", "Bản nháp"
        PUBLISHED = "PUBLISHED", "Công khai"
        UNPUBLISHED = "UNPUBLISHED", "Ngừng công khai"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="custom_pages",
        verbose_name="Chủ sở hữu",
        help_text="Người dùng sở hữu trang.",
        db_comment="Chủ sở hữu trang",
    )
    path = models.ForeignKey(
        "utilities.PagePath",
        on_delete=models.PROTECT,
        related_name="pages",
        verbose_name="Đường dẫn giữa",
        help_text="Đoạn URL giữa (`qr`, `p`...).",
        db_comment="Đường dẫn giữa của trang",
    )
    title = models.CharField(
        max_length=150, verbose_name="Tiêu đề", help_text="Tiêu đề trang.", db_comment="Tiêu đề trang"
    )
    slug = models.CharField(
        max_length=64,
        verbose_name="Slug",
        help_text="Đoạn cuối của URL công khai, unique trong cùng đường dẫn giữa.",
        db_comment="Slug URL trang",
    )
    description = models.TextField(
        blank=True, max_length=1000, verbose_name="Mô tả", help_text="Mô tả trang.", db_comment="Mô tả trang"
    )
    status = models.CharField(
        max_length=11,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name="Trạng thái",
        help_text="Chỉ PUBLISHED mới công khai.",
        db_comment="Trạng thái trang",
    )
    content = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Nội dung",
        help_text="Tài liệu Tiptap đã validate (chỉ node/mark trong danh sách cho phép).",
        db_comment="Nội dung Tiptap JSON",
    )
    content_version = models.PositiveIntegerField(
        default=1,
        verbose_name="Phiên bản nội dung",
        help_text="Tăng mỗi lần lưu nội dung; PATCH phải gửi đúng để không ghi đè lẫn nhau.",
        db_comment="Phiên bản nội dung",
    )
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Công khai lúc",
        help_text="Lần gần nhất chuyển sang PUBLISHED.",
        db_comment="Thời điểm công khai",
    )
    seo_title = models.CharField(
        max_length=160,
        blank=True,
        verbose_name="SEO title",
        help_text="Tiêu đề SEO, rỗng dùng title.",
        db_comment="Tiêu đề SEO",
    )
    seo_description = models.CharField(
        max_length=300,
        blank=True,
        verbose_name="SEO description",
        help_text="Mô tả SEO.",
        db_comment="Mô tả SEO",
    )
    theme = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Giao diện",
        help_text="Theme có cấu trúc, không chứa CSS/JS tùy ý.",
        db_comment="Cấu hình theme",
    )
    avatar = models.ForeignKey(
        "attachment.Attachment",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Ảnh đại diện",
        help_text="Attachment ảnh đại diện.",
        db_comment="Ảnh đại diện trang",
    )
    cover = models.ForeignKey(
        "attachment.Attachment",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Ảnh bìa",
        help_text="Attachment ảnh bìa.",
        db_comment="Ảnh bìa trang",
    )

    class Meta:
        db_table = "utilities_page"
        verbose_name = "Trang tùy chỉnh"
        verbose_name_plural = "Trang tùy chỉnh"
        constraints = [
            # Không điều kiện: slug đã xóa không dùng lại trong cùng đường dẫn giữa.
            models.UniqueConstraint("path", Lower("slug"), name="utilities_page_path_slug_ci_unique"),
            models.CheckConstraint(
                condition=models.Q(status__in=["DRAFT", "PUBLISHED", "UNPUBLISHED"]),
                name="utilities_page_status_valid",
            ),
        ]
        indexes = [
            models.Index(
                fields=["owner", "-created_at"],
                condition=models.Q(deleted_at__isnull=True),
                name="page_owner_created_alive_idx",
            )
        ]

    def __str__(self) -> str:
        """Tiêu đề trang."""
        return self.title
