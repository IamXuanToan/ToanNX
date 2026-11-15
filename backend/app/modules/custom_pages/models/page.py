"""Trang tùy chỉnh có owner và slug công khai."""

from django.conf import settings
from django.db import models
from django.db.models.functions import Lower

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class Page(JournalTracker, CoreModel):
    """Trang cá nhân; nội dung được lưu thành các PageBlock có cấu trúc."""

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
    title = models.CharField(
        max_length=150, verbose_name="Tiêu đề", help_text="Tiêu đề trang.", db_comment="Tiêu đề trang"
    )
    slug = models.CharField(
        max_length=64,
        verbose_name="Slug",
        help_text="Đường dẫn công khai sau /p/.",
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
        db_table = "custom_page"
        verbose_name = "Trang tùy chỉnh"
        verbose_name_plural = "Trang tùy chỉnh"
        constraints = [models.UniqueConstraint(Lower("slug"), name="custom_page_slug_ci_unique")]
        indexes = [models.Index(fields=["owner", "created_at"], name="cp_owner_created_idx")]
