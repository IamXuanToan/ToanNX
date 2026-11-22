"""Model tài khoản mạng xã hội liên kết (Google, GitHub...).

Kế thừa CoreModel: có ID UUID, timestamps, audit và xóa mềm bằng deleted_at.
"""

from django.conf import settings
from django.db import models

from app.core.models.core_model import CoreModel


class UserSocialAccount(CoreModel):
    """Liên kết tài khoản mạng xã hội với người dùng trong hệ thống."""

    class Provider(models.TextChoices):
        """Nền tảng mạng xã hội được hỗ trợ."""

        GOOGLE = "google", "Google"
        GITHUB = "github", "GitHub"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="social_accounts",
        verbose_name="Người dùng",
        help_text="Tài khoản hệ thống được liên kết.",
        db_comment="Tài khoản hệ thống sở hữu liên kết",
    )
    provider = models.CharField(
        max_length=32,
        choices=Provider.choices,
        db_index=True,
        verbose_name="Nền tảng",
        help_text="Mã định danh nền tảng (google, github...).",
        db_comment="Nền tảng OAuth",
    )
    uid = models.CharField(
        max_length=255,
        db_index=True,
        verbose_name="ID người dùng trên nền tảng",
        help_text="Định danh duy nhất của người dùng từ nhà cung cấp OAuth (sub, id...).",
        db_comment="ID định danh từ OAuth provider",
    )
    email = models.EmailField(
        blank=True,
        default="",
        verbose_name="Email mạng xã hội",
        help_text="Email nhận được từ nhà cung cấp OAuth tại thời điểm liên kết.",
        db_comment="Email từ OAuth provider",
    )
    display_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Tên hiển thị",
        help_text="Tên hiển thị hoặc username từ nhà cung cấp OAuth.",
        db_comment="Tên hiển thị từ OAuth provider",
    )
    avatar_url = models.URLField(
        max_length=1024,
        blank=True,
        default="",
        verbose_name="URL ảnh đại diện",
        help_text="Đường dẫn ảnh đại diện từ nhà cung cấp OAuth.",
        db_comment="URL avatar từ OAuth provider",
    )
    extra_data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Dữ liệu mở rộng",
        help_text="Dữ liệu bổ sung từ profile nhà cung cấp để dễ mở rộng sau này.",
        db_comment="Dữ liệu bổ sung dạng JSON",
    )

    class Meta:
        db_table = "system_user_social_account"
        verbose_name = "Tài khoản mạng xã hội"
        verbose_name_plural = "Tài khoản mạng xã hội"
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "uid"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_system_social_provider_uid",
            ),
            models.UniqueConstraint(
                fields=["user", "provider"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_system_user_social_provider",
            ),
        ]

    def __str__(self) -> str:
        """Biểu diễn chuỗi: provider:uid (user)."""
        return f"{self.provider}:{self.uid} -> {self.user_id}"
