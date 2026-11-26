"""Model Dịch vụ & Gói đăng ký định kỳ."""

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import Q

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker
from app.workspace.constants.workspace_defaults import (
    DEFAULT_REMINDER_DAYS_BEFORE,
    DEFAULT_WORKSPACE_NOTIFICATION_CHANNELS,
)


def _default_reminder_days() -> list[int]:
    return list(DEFAULT_REMINDER_DAYS_BEFORE)


def _default_notification_channels() -> list[str]:
    return list(DEFAULT_WORKSPACE_NOTIFICATION_CHANNELS)


class Subscription(JournalTracker, CoreModel):
    """Dịch vụ định kỳ (Domain, VPS, SaaS, Viễn thông...) kèm mốc gia hạn và nhắc trước."""

    journal_fields = (
        "name",
        "provider",
        "category",
        "billing_cycle",
        "amount_vnd",
        "renew_date",
        "auto_renew",
        "is_active",
        "notification_channels",
    )

    class Category(models.TextChoices):
        """Nhóm dịch vụ."""

        DOMAIN = "DOMAIN", "Tên miền"
        HOSTING_VPS = "HOSTING_VPS", "Hosting / VPS"
        SAAS_TOOL = "SAAS_TOOL", "Công cụ SaaS / AI"
        ENTERTAINMENT = "ENTERTAINMENT", "Giải trí"
        TELECOM = "TELECOM", "Viễn thông / Internet"
        OTHER = "OTHER", "Khác"

    class BillingCycle(models.TextChoices):
        """Chu kỳ gia hạn."""

        WEEKLY = "WEEKLY", "Hàng tuần"
        MONTHLY = "MONTHLY", "Hàng tháng"
        QUARTERLY = "QUARTERLY", "Hàng quý (3 tháng)"
        SEMI_ANNUAL = "SEMI_ANNUAL", "6 tháng"
        YEARLY = "YEARLY", "Hàng năm"
        CUSTOM_DAYS = "CUSTOM_DAYS", "Tùy chỉnh theo ngày"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_subscriptions",
        verbose_name="Chủ sở hữu",
        help_text="Người sở hữu gói dịch vụ.",
        db_comment="Chủ sở hữu dịch vụ",
    )
    name = models.CharField(
        max_length=200,
        verbose_name="Tên dịch vụ",
        help_text="Tên dịch vụ hoặc tên miền cần theo dõi.",
        db_comment="Tên dịch vụ",
    )
    provider = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Nhà cung cấp",
        help_text="Đơn vị cung cấp dịch vụ (Hetzner, Cloudflare, Viettel...).",
        db_comment="Nhà cung cấp",
    )
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.SAAS_TOOL,
        verbose_name="Nhóm dịch vụ",
        help_text="Phân loại dịch vụ định kỳ.",
        db_comment="Nhóm dịch vụ",
    )
    billing_cycle = models.CharField(
        max_length=20,
        choices=BillingCycle.choices,
        default=BillingCycle.MONTHLY,
        verbose_name="Chu kỳ gia hạn",
        help_text="Chu kỳ tính cước lặp lại.",
        db_comment="Chu kỳ gia hạn",
    )
    custom_cycle_days = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Số ngày chu kỳ tùy chỉnh",
        help_text="Bắt buộc > 0 khi chọn chu kỳ tùy chỉnh theo ngày.",
        db_comment="Số ngày chu kỳ tùy chỉnh",
    )
    anchor_day = models.PositiveSmallIntegerField(
        default=1,
        verbose_name="Ngày chốt định kỳ",
        help_text="Ngày gốc trong tháng (1–31) để không bị lệch mốc sau tháng 2.",
        db_comment="Ngày gốc gia hạn",
    )
    amount = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=Decimal("0"),
        verbose_name="Giá cước gốc",
        help_text="Mức phí theo nguyên tệ.",
        db_comment="Mức phí nguyên tệ",
    )
    currency = models.ForeignKey(
        "system.Currency",
        on_delete=models.PROTECT,
        related_name="workspace_subscriptions",
        verbose_name="Tiền tệ",
        help_text="Đơn vị tiền tệ niêm yết.",
        db_comment="Tiền tệ dịch vụ",
    )
    exchange_rate = models.DecimalField(
        max_digits=18,
        decimal_places=6,
        default=Decimal("1"),
        verbose_name="Tỷ giá quy đổi",
        help_text="Tỷ giá quy đổi gần nhất sang VNĐ.",
        db_comment="Tỷ giá quy đổi",
    )
    amount_vnd = models.DecimalField(
        max_digits=18,
        decimal_places=0,
        default=Decimal("0"),
        verbose_name="Chi phí quy đổi VNĐ",
        help_text="Chi phí ước tính bằng VNĐ.",
        db_comment="Chi phí VNĐ",
    )
    renew_date = models.DateField(
        db_index=True,
        verbose_name="Ngày gia hạn tiếp theo",
        help_text="Mốc ngày tới hạn thanh toán tiếp theo.",
        db_comment="Ngày gia hạn tiếp theo",
    )
    auto_renew = models.BooleanField(
        default=False,
        verbose_name="Tự động trừ tiền",
        help_text="Đánh dấu dịch vụ tự động gia hạn qua thẻ/ví.",
        db_comment="Tự động gia hạn",
    )
    payment_method = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Phương thức thanh toán",
        help_text="Ví dụ: Visa •••• 1234, Momo, Chuyển khoản.",
        db_comment="Phương thức thanh toán",
    )
    manage_url = models.URLField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Trang quản trị dịch vụ",
        help_text="Link trang billing/quản trị của nhà cung cấp.",
        db_comment="URL quản trị dịch vụ",
    )
    reminder_days_before = models.JSONField(
        default=_default_reminder_days,
        blank=True,
        verbose_name="Số ngày nhắc trước",
        help_text="Danh sách số ngày nhắc trước hạn (ví dụ [7, 3, 1]).",
        db_comment="Danh sách ngày nhắc trước",
    )
    notification_channels = models.JSONField(
        default=_default_notification_channels,
        blank=True,
        verbose_name="Kênh nhận thông báo",
        help_text="Danh sách kênh thông báo (`WEBSITE`, `TELEGRAM`, `EMAIL`).",
        db_comment="Kênh nhận thông báo",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Đang theo dõi",
        help_text="Tắt để tạm ngưng thông báo gia hạn.",
        db_comment="Đang theo dõi",
    )
    notes = models.TextField(
        blank=True,
        default="",
        verbose_name="Ghi chú",
        help_text="Ghi chú gói cước hoặc tài khoản đăng ký.",
        db_comment="Ghi chú",
    )

    class Meta:
        db_table = "workspace_subscription"
        indexes = (
            models.Index(
                fields=("owner", "renew_date"),
                condition=Q(deleted_at__isnull=True),
                name="idx_ws_sub_owner_renew",
            ),
            models.Index(
                fields=("owner", "is_active"),
                condition=Q(deleted_at__isnull=True),
                name="idx_ws_sub_owner_active",
            ),
        )
        verbose_name = "Dịch vụ định kỳ"
        verbose_name_plural = "Dịch vụ định kỳ"

    def __str__(self) -> str:
        """Tên dịch vụ."""
        return self.name
