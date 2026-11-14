"""Model phiên đăng nhập.

Không kế thừa CoreModel: không cần audit người tạo, xóa cứng theo retention.
"""

import uuid

from django.conf import settings
from django.db import models


class AuthSession(models.Model):
    """Một phiên đăng nhập = một họ refresh token (token family)."""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name="Mã phiên",
        help_text="Định danh phiên; nằm trong claim `sid` của access token.",
        db_comment="Mã phiên",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="auth_sessions",
        verbose_name="Người dùng",
        help_text="Chủ sở hữu phiên.",
        db_comment="Chủ phiên",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Thời điểm đăng nhập",
        help_text="Thời điểm đăng nhập tạo phiên.",
        db_comment="Thời điểm đăng nhập",
    )
    expires_at = models.DateTimeField(
        verbose_name="Hết hạn",
        help_text="Thời hạn tuyệt đối của phiên; refresh không kéo dài thời hạn này.",
        db_comment="Hết hạn tuyệt đối của phiên",
    )
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Lần dùng gần nhất",
        help_text="Lần refresh gần nhất.",
        db_comment="Lần dùng gần nhất",
    )
    revoked_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Thời điểm thu hồi",
        help_text="Khác NULL: phiên đã bị thu hồi, mọi token của phiên không còn dùng được.",
        db_comment="Thời điểm thu hồi",
    )
    revoked_reason = models.CharField(
        max_length=32,
        blank=True,
        verbose_name="Lý do thu hồi",
        help_text="Lý do thu hồi: logout, logout_all, user_revoked, reuse_detected, expired...",
        db_comment="Lý do thu hồi",
    )
    user_agent = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Thiết bị",
        help_text="User-Agent rút gọn, chỉ để người dùng nhận biết phiên.",
        db_comment="User-Agent rút gọn",
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name="Địa chỉ IP",
        help_text="IP client khi đăng nhập (để người dùng nhận biết phiên).",
        db_comment="IP client",
    )

    class Meta:
        db_table = "auth_session"
        verbose_name = "Phiên đăng nhập"
        verbose_name_plural = "Phiên đăng nhập"
        indexes = [models.Index(fields=["user", "revoked_at"], name="idx_auth_session_user")]

    def __str__(self) -> str:
        """Biểu diễn bằng id."""
        return str(self.id)
