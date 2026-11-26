"""Model Cài đặt Trợ lý cá nhân, Lịch Digest & Chính sách hiển thị Telegram Group cho từng user."""

from django.conf import settings
from django.db import models
from django.db.models import Q

from app.core.constants.defaults import DEFAULT_TIMEZONE
from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker
from app.workspace.constants.workspace_defaults import (
    DEFAULT_DIGEST_SECTIONS,
    DEFAULT_DIGEST_TIME_SLOTS,
    DEFAULT_REMINDER_DAYS_BEFORE,
    DEFAULT_WARRANTY_ALERT_DAYS,
)


def _default_digest_slots() -> list[str]:
    return list(DEFAULT_DIGEST_TIME_SLOTS)


def _default_digest_sections() -> list[str]:
    return list(DEFAULT_DIGEST_SECTIONS)


def _default_warranty_days() -> list[int]:
    return list(DEFAULT_WARRANTY_ALERT_DAYS)


def _default_subscription_days() -> list[int]:
    return list(DEFAULT_REMINDER_DAYS_BEFORE)


class WorkspaceSetting(JournalTracker, CoreModel):
    """Cài đặt cá nhân hóa mỗi người dùng (dùng ForeignKey + UniqueConstraint hỗ trợ soft-delete)."""

    journal_fields = (
        "timezone",
        "daily_digest_enabled",
        "digest_time_slots",
        "digest_sections",
        "preferred_ai_model",
        "telegram_ai_enabled",
        "telegram_group_tool_policy",
        "telegram_group_hide_amounts",
        "telegram_group_reply_in_dm",
    )

    class GroupToolPolicy(models.TextChoices):
        """Chính sách cho phép gọi AI/tool cá nhân trong nhóm Telegram."""

        DISABLED = "DISABLED", "Tắt trong nhóm"
        OWNER_ONLY = "OWNER_ONLY", "Chỉ chủ sở hữu"
        ALL_MEMBERS = "ALL_MEMBERS", "Mọi thành viên nhóm"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_settings",
        verbose_name="Chủ sở hữu",
        help_text="Người dùng sở hữu cấu hình.",
        db_comment="Chủ sở hữu cấu hình",
    )
    timezone = models.CharField(
        max_length=64,
        default=DEFAULT_TIMEZONE,
        verbose_name="Múi giờ",
        help_text="Múi giờ chuẩn IANA để tính lịch và Digest (VD: Asia/Ho_Chi_Minh).",
        db_comment="Múi giờ IANA",
    )
    daily_digest_enabled = models.BooleanField(
        default=True,
        verbose_name="Bật tóm tắt hàng ngày",
        help_text="Gửi bản tin tổng hợp việc & hạn theo khung giờ.",
        db_comment="Bật Daily Digest",
    )
    digest_time_slots = models.JSONField(
        default=_default_digest_slots,
        blank=True,
        verbose_name="Khung giờ Digest",
        help_text="Danh sách giờ định dạng HH:MM gửi bản tin.",
        db_comment="Khung giờ Digest HH:MM",
    )
    digest_sections = models.JSONField(
        default=_default_digest_sections,
        blank=True,
        verbose_name="Mục hiển thị trong Digest",
        help_text="Các nhóm thông tin đưa vào bản tin tổng hợp.",
        db_comment="Các khối Digest",
    )
    warranty_alert_days = models.JSONField(
        default=_default_warranty_days,
        blank=True,
        verbose_name="Mốc nhắc hạn bảo hành",
        help_text="Số ngày nhắc trước khi thiết bị hết bảo hành.",
        db_comment="Ngày nhắc bảo hành",
    )
    subscription_default_alert_days = models.JSONField(
        default=_default_subscription_days,
        blank=True,
        verbose_name="Mốc nhắc gia hạn mặc định",
        help_text="Số ngày nhắc mặc định cho gói dịch vụ mới.",
        db_comment="Ngày nhắc gia hạn mặc định",
    )
    preferred_ai_model = models.CharField(
        max_length=120,
        blank=True,
        default="",
        verbose_name="Model AI ưu tiên",
        help_text="Để trống để dùng thứ tự ưu tiên hệ thống.",
        db_comment="Model AI ưu tiên",
    )
    ai_daily_token_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
        default=None,
        verbose_name="Giới hạn token AI mỗi ngày",
        help_text="Để trống nếu không đặt giới hạn ngày.",
        db_comment="Giới hạn token AI ngày",
    )
    telegram_ai_enabled = models.BooleanField(
        default=False,
        verbose_name="Bật trợ lý AI trên Telegram",
        help_text="Cho phép hỏi đáp & lệnh Slash qua Bot Telegram chung.",
        db_comment="Bật trợ lý Telegram",
    )
    telegram_owner_user_id = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name="Telegram User ID chính chủ",
        help_text="Tự động gắn khi nhắn /start <code> hoặc /verify_owner từ DM.",
        db_comment="Telegram User ID chủ sở hữu",
    )
    telegram_allowed_chat_ids = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Danh sách Chat ID được phép",
        help_text="Danh sách UUID của system.TelegramChat được bật tương tác AI.",
        db_comment="Danh sách TelegramChat ID",
    )
    telegram_group_require_mention = models.BooleanField(
        default=True,
        verbose_name="Nhóm phải @tag hoặc reply bot",
        help_text="Tránh bot trả lời mọi tin nhắn thông thường trong nhóm.",
        db_comment="Bắt buộc tag bot trong nhóm",
    )
    telegram_group_tool_policy = models.CharField(
        max_length=16,
        choices=GroupToolPolicy.choices,
        default=GroupToolPolicy.OWNER_ONLY,
        verbose_name="Chính sách dữ liệu cá nhân trong nhóm",
        help_text="Giới hạn ai có thể kích hoạt tool đọc dữ liệu cá nhân trong nhóm.",
        db_comment="Chính sách tool nhóm Telegram",
    )
    telegram_group_hide_amounts = models.BooleanField(
        default=False,
        verbose_name="Ẩn số tiền trong nhóm",
        help_text="Che giá trị tiền tệ nhạy cảm khi bot trả lời ở nhóm công khai.",
        db_comment="Ẩn số tiền ở nhóm Telegram",
    )
    telegram_group_reply_in_dm = models.BooleanField(
        default=False,
        verbose_name="Gửi chi tiết riêng tư vào DM",
        help_text="Chỉ gửi chi tiết riêng tư về DM của chính chủ khi được hỏi trong nhóm.",
        db_comment="Trả lời dữ liệu riêng tư qua DM",
    )

    class Meta:
        db_table = "workspace_setting"
        constraints = (
            models.UniqueConstraint(
                fields=("owner",),
                condition=Q(deleted_at__isnull=True),
                name="uq_workspace_setting_owner",
            ),
        )
        verbose_name = "Cài đặt Trợ lý"
        verbose_name_plural = "Cài đặt Trợ lý"

    def __str__(self) -> str:
        """Tên hiển thị cấu hình."""
        return f"WorkspaceSetting({self.owner_id})"
