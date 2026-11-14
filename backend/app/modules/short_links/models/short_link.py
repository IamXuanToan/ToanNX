"""Liên kết rút gọn có owner và slug công khai."""

from django.conf import settings
from django.db import models
from django.db.models.functions import Lower

from app.core.models.core_model import CoreModel


class ShortLink(CoreModel):
    """URL chuyển hướng do người dùng quản lý."""

    class Status(models.TextChoices):
        """Trạng thái cấu hình; EXPIRED được tính từ expires_at."""

        ACTIVE = "ACTIVE", "Hoạt động"
        INACTIVE = "INACTIVE", "Tạm tắt"

    class RedirectType(models.IntegerChoices):
        """HTTP redirect code."""

        PERMANENT = 301, "301"
        TEMPORARY = 302, "302"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="short_links",
        verbose_name="Chủ sở hữu",
        help_text="Người dùng sở hữu liên kết.",
        db_comment="Chủ sở hữu liên kết",
    )
    name = models.CharField(
        max_length=150, verbose_name="Tên", help_text="Tên hiển thị trong quản lý.", db_comment="Tên liên kết"
    )
    slug = models.CharField(
        max_length=64,
        verbose_name="Slug",
        help_text="Đường dẫn công khai sau /s/.",
        db_comment="Slug URL liên kết",
    )
    destination_url = models.URLField(
        max_length=2048,
        verbose_name="URL đích",
        help_text="URL HTTP/HTTPS tuyệt đối.",
        db_comment="URL chuyển hướng",
    )
    description = models.TextField(
        blank=True,
        max_length=1000,
        verbose_name="Mô tả",
        help_text="Mô tả tùy chọn.",
        db_comment="Mô tả liên kết",
    )
    redirect_type = models.PositiveSmallIntegerField(
        choices=RedirectType.choices,
        default=RedirectType.TEMPORARY,
        verbose_name="Kiểu chuyển hướng",
        help_text="301 được cache lâu; mặc định 302.",
        db_comment="HTTP status chuyển hướng",
    )
    status = models.CharField(
        max_length=8,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name="Trạng thái",
        help_text="ACTIVE cho phép chuyển hướng.",
        db_comment="Trạng thái liên kết",
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Hết hạn",
        help_text="Thời điểm hết hạn, null là không giới hạn.",
        db_comment="Thời điểm hết hạn",
    )

    class Meta:
        db_table = "short_link"
        verbose_name = "Liên kết rút gọn"
        verbose_name_plural = "Liên kết rút gọn"
        constraints = [models.UniqueConstraint(Lower("slug"), name="short_link_slug_ci_unique")]
        indexes = [models.Index(fields=["owner", "created_at"], name="sl_owner_created_idx")]
