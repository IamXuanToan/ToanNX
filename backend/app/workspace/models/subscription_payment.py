"""Model Lịch sử thanh toán gia hạn dịch vụ định kỳ."""

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import Q

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class SubscriptionPayment(JournalTracker, CoreModel):
    """Lưu lịch sử từng lần thanh toán gia hạn, giữ nguyên tỷ giá lịch sử và hóa đơn đính kèm."""

    journal_fields = ("paid_on", "period_from", "period_to", "amount_vnd", "payment_method")

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_subscription_payments",
        verbose_name="Chủ sở hữu",
        help_text="Người sở hữu giao dịch gia hạn.",
        db_comment="Chủ sở hữu giao dịch",
    )
    subscription = models.ForeignKey(
        "workspace.Subscription",
        on_delete=models.CASCADE,
        related_name="payments",
        verbose_name="Dịch vụ định kỳ",
        help_text="Gói dịch vụ được gia hạn.",
        db_comment="Dịch vụ định kỳ",
    )
    paid_on = models.DateField(
        db_index=True,
        verbose_name="Ngày thanh toán",
        help_text="Ngày thực hiện thanh toán.",
        db_comment="Ngày thanh toán",
    )
    period_from = models.DateField(
        verbose_name="Từ ngày",
        help_text="Ngày bắt đầu chu kỳ mới.",
        db_comment="Từ ngày chu kỳ",
    )
    period_to = models.DateField(
        verbose_name="Đến ngày",
        help_text="Ngày kết thúc chu kỳ (mốc gia hạn kế tiếp).",
        db_comment="Đến ngày chu kỳ",
    )
    amount = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=Decimal("0"),
        verbose_name="Số tiền gốc",
        help_text="Số tiền đã trả theo nguyên tệ.",
        db_comment="Số tiền nguyên tệ",
    )
    currency = models.ForeignKey(
        "system.Currency",
        on_delete=models.PROTECT,
        related_name="workspace_subscription_payments",
        verbose_name="Tiền tệ",
        help_text="Đơn vị tiền tệ kỳ thanh toán.",
        db_comment="Tiền tệ thanh toán",
    )
    exchange_rate = models.DecimalField(
        max_digits=18,
        decimal_places=6,
        default=Decimal("1"),
        verbose_name="Tỷ giá quy đổi",
        help_text="Tỷ giá tại ngày thanh toán.",
        db_comment="Tỷ giá quy đổi",
    )
    amount_vnd = models.DecimalField(
        max_digits=18,
        decimal_places=0,
        default=Decimal("0"),
        verbose_name="Số tiền VNĐ",
        help_text="Giá trị quy đổi VNĐ tại ngày thanh toán.",
        db_comment="Số tiền VNĐ",
    )
    payment_method = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Phương thức thanh toán",
        help_text="Thẻ/ví/tài khoản sử dụng.",
        db_comment="Phương thức thanh toán",
    )
    receipt_attachment = models.ForeignKey(
        "system.Attachment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="workspace_subscription_payments",
        verbose_name="Biên lai thanh toán",
        help_text="Tệp chứng từ thanh toán riêng tư.",
        db_comment="Biên lai riêng tư",
    )
    note = models.TextField(
        blank=True,
        default="",
        verbose_name="Ghi chú",
        help_text="Ghi chú cho kỳ gia hạn này.",
        db_comment="Ghi chú thanh toán",
    )

    class Meta:
        db_table = "workspace_subscription_payment"
        indexes = (
            models.Index(
                fields=("owner", "paid_on"),
                condition=Q(deleted_at__isnull=True),
                name="idx_ws_subpay_owner_paid",
            ),
        )
        verbose_name = "Thanh toán gia hạn"
        verbose_name_plural = "Thanh toán gia hạn"

    def __str__(self) -> str:
        """Mô tả kỳ thanh toán."""
        return f"{self.subscription.name} ({self.paid_on})"
