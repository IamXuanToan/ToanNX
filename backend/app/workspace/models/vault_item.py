"""Model Két sắt Bí mật cá nhân (mã hóa Fernet qua SecretCipher, che bản rõ mặc định)."""

from django.conf import settings
from django.db import models
from django.db.models import Q

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class VaultItem(JournalTracker, CoreModel):
    """Lưu thông tin nhạy cảm đã mã hóa; Journal và API danh sách che toàn bộ bản rõ."""

    journal_fields = ("title", "category", "username", "url", "last_revealed_at")
    journal_masked_fields = ("secret_encrypted", "secret_last4")

    class Category(models.TextChoices):
        """Nhóm bí mật."""

        SERVER = "SERVER", "Máy chủ / SSH"
        API_KEY = "API_KEY", "API Key"
        ACCOUNT = "ACCOUNT", "Tài khoản"
        SNIPPET = "SNIPPET", "Đoạn mã / Khóa"
        ENV_CONFIG = "ENV_CONFIG", "Cấu hình ENV"
        OTHER = "OTHER", "Khác"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_vault_items",
        verbose_name="Chủ sở hữu",
        help_text="Người sở hữu mục két sắt.",
        db_comment="Chủ sở hữu két sắt",
    )
    title = models.CharField(
        max_length=200,
        verbose_name="Tiêu đề",
        help_text="Tên gợi nhớ mục bí mật.",
        db_comment="Tiêu đề mục bí mật",
    )
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.ACCOUNT,
        verbose_name="Phân loại",
        help_text="Nhóm bí mật lưu trữ.",
        db_comment="Loại bí mật",
    )
    username = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="Tài khoản / Định danh",
        help_text="Tên đăng nhập hoặc key prefix công khai.",
        db_comment="Tên tài khoản",
    )
    secret_encrypted = models.TextField(
        verbose_name="Bí mật đã mã hóa",
        help_text="Chuỗi mã hóa bằng SecretCipher.",
        db_comment="Bí mật mã hóa Fernet",
    )
    secret_last4 = models.CharField(
        max_length=4,
        blank=True,
        default="",
        verbose_name="4 ký tự cuối",
        help_text="4 ký tự cuối để nhận diện mà không lộ toàn bộ.",
        db_comment="4 ký tự cuối",
    )
    url = models.CharField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Đường dẫn liên quan",
        help_text="URL dịch vụ hoặc địa chỉ máy chủ.",
        db_comment="Đường dẫn liên quan",
    )
    notes = models.TextField(
        blank=True,
        default="",
        verbose_name="Ghi chú",
        help_text="Ghi chú bổ sung (không chứa bí mật chính).",
        db_comment="Ghi chú",
    )
    tags = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Thẻ gắn",
        help_text="Danh sách từ khóa phân loại.",
        db_comment="Thẻ phân loại",
    )
    last_revealed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Mở xem lần cuối",
        help_text="Thời điểm gần nhất giải mã xem bí mật.",
        db_comment="Thời điểm giải mã gần nhất",
    )
    last_revealed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        verbose_name="Người mở xem lần cuối",
        help_text="Tài khoản thực hiện lệnh giải mã gần nhất.",
        db_comment="Người giải mã gần nhất",
    )

    class Meta:
        db_table = "workspace_vault_item"
        indexes = (
            models.Index(
                fields=("owner", "category"),
                condition=Q(deleted_at__isnull=True),
                name="idx_ws_vault_owner_cat",
            ),
        )
        verbose_name = "Mục két sắt"
        verbose_name_plural = "Mục két sắt"

    def __str__(self) -> str:
        """Tiêu đề mục két sắt."""
        return self.title
