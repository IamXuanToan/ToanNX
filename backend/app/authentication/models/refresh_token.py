"""Model refresh token."""

import uuid

from django.db import models

from app.authentication.models.auth_session import AuthSession


class RefreshToken(models.Model):
    """Refresh token; chỉ lưu HMAC-SHA256 của token, không lưu token thô."""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name="Mã token",
        help_text="Định danh token (không phải giá trị token).",
        db_comment="Mã token",
    )
    session = models.ForeignKey(
        AuthSession,
        on_delete=models.CASCADE,
        related_name="refresh_tokens",
        verbose_name="Phiên",
        help_text="Phiên (token family) chứa token này.",
        db_comment="Phiên",
    )
    token_hash = models.CharField(
        max_length=64,
        unique=True,
        verbose_name="Hash token",
        help_text="HMAC-SHA256 của refresh token; không lưu token thô.",
        db_comment="HMAC-SHA256 token",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Thời điểm tạo",
        help_text="Thời điểm phát hành token.",
        db_comment="Thời điểm phát hành",
    )
    expires_at = models.DateTimeField(
        verbose_name="Hết hạn",
        help_text="Hết hạn cùng phiên.",
        db_comment="Hết hạn",
    )
    rotated_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Thời điểm xoay vòng",
        help_text="Khác NULL: token đã được đổi sang token mới, dùng lại là reuse.",
        db_comment="Thời điểm xoay vòng",
    )
    replaced_by = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Token thay thế",
        help_text="Token mới được phát khi xoay vòng token này.",
        db_comment="Token thay thế",
    )

    class Meta:
        db_table = "auth_refresh_token"
        verbose_name = "Refresh token"
        verbose_name_plural = "Refresh token"

    def __str__(self) -> str:
        """Biểu diễn bằng id (không bao giờ in hash)."""
        return str(self.id)
