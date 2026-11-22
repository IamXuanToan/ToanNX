"""Kết nối SePay của một người: URL webhook riêng (`public_id`), token API mã hóa, secret webhook dẫn xuất."""

import uuid

from django.conf import settings
from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class SepayConnection(JournalTracker, CoreModel):
    """Secret webhook = salted_hmac(public_id:secret_version) từ DJANGO_SECRET_KEY, không lưu DB."""

    journal_fields = ("is_active", "secret_version", "token_last4")

    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sepay_connection",
        verbose_name="Chủ",
        help_text="Người dùng sở hữu.",
        db_comment="Chủ",
    )
    public_id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        verbose_name="Mã công khai",
        help_text="Nằm trong URL webhook.",
        db_comment="Mã công khai webhook",
    )
    api_token_encrypted = models.TextField(
        blank=True,
        default="",
        verbose_name="Token API (mã hóa)",
        help_text="Token SePay đã mã hóa.",
        db_comment="Token API đã mã hóa",
    )
    token_last4 = models.CharField(
        max_length=4,
        blank=True,
        default="",
        verbose_name="4 ký tự cuối token",
        help_text="Để nhận ra token.",
        db_comment="4 ký tự cuối token",
    )
    secret_version = models.PositiveIntegerField(
        default=1,
        verbose_name="Phiên bản secret",
        help_text="Tăng để đổi secret webhook.",
        db_comment="Phiên bản secret",
    )
    is_active = models.BooleanField(
        default=True, verbose_name="Đang bật", help_text="Tắt thì webhook trả 401.", db_comment="Đang bật"
    )
    last_webhook_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Webhook lần cuối",
        help_text="Lần nhận webhook hợp lệ gần nhất.",
        db_comment="Webhook lần cuối",
    )
    last_sync_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Lấy thủ công lần cuối",
        help_text="Lần import gần nhất.",
        db_comment="Import lần cuối",
    )
    last_error = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Lỗi gần nhất",
        help_text="Mã/lý do lỗi gần nhất.",
        db_comment="Lỗi gần nhất",
    )

    class Meta:
        db_table = "finance_sepay_connection"
        verbose_name = "Kết nối SePay"
        verbose_name_plural = "Kết nối SePay"

    def __str__(self) -> str:
        """Mã công khai."""
        return str(self.public_id)
