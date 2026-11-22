"""Một giao dịch thu nhập (nhập tay hoặc từ SePay): số gốc + quy đổi VNĐ + khấu trừ thuế đã chụp."""

from django.conf import settings
from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker
from app.finance.constants.finance_choices import RateSource


class Income(JournalTracker, CoreModel):
    """Mỗi giao dịch tự giữ tỷ giá, % và tiền thuế lúc tính, nên đổi cấu hình sau không làm sai số cũ."""

    class Source(models.TextChoices):
        """Nguồn ghi nhận."""

        MANUAL = "MANUAL", "Nhập tay"
        SEPAY = "SEPAY", "SePay"

    class AmountStatus(models.TextChoices):
        """Đọc được số tiền hay chưa."""

        OK = "OK", "Đã có số tiền"
        UNKNOWN = "UNKNOWN", "Không rõ số tiền"

    class TaxStatus(models.TextChoices):
        """Trạng thái khấu trừ."""

        WITHHELD = "WITHHELD", "Đã khấu trừ"
        NOT_WITHHELD = "NOT_WITHHELD", "Không khấu trừ"
        NO_RATE = "NO_RATE", "Chưa cấu hình thuế"
        UNCLASSIFIED = "UNCLASSIFIED", "Chưa nhận diện"
        PENDING = "PENDING", "Chờ số tiền"

    journal_fields = (
        "received_at",
        "platform",
        "currency",
        "original_amount",
        "exchange_rate",
        "amount",
        "tax_withheld",
        "tax_rate",
        "tax_amount",
        "content",
        "note",
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="finance_incomes",
        verbose_name="Chủ",
        help_text="Người dùng sở hữu.",
        db_comment="Chủ",
    )
    source = models.CharField(
        max_length=16,
        choices=Source.choices,
        verbose_name="Nguồn",
        help_text="MANUAL / SEPAY.",
        db_comment="Nguồn",
    )
    received_at = models.DateTimeField(
        verbose_name="Nhận lúc", help_text="Thời điểm tiền vào (UTC).", db_comment="Thời điểm tiền vào"
    )
    received_date = models.DateField(
        db_index=True,
        verbose_name="Ngày nhận",
        help_text="Ngày giờ Việt Nam của received_at.",
        db_comment="Ngày nhận (giờ VN)",
    )
    content = models.TextField(
        blank=True,
        default="",
        verbose_name="Nội dung",
        help_text="Nội dung chuyển khoản / mô tả.",
        db_comment="Nội dung",
    )
    note = models.TextField(
        blank=True, default="", verbose_name="Ghi chú", help_text="Ghi chú tham khảo.", db_comment="Ghi chú"
    )
    # ---- tiền gốc + quy đổi
    currency = models.ForeignKey(
        "system.Currency",
        on_delete=models.PROTECT,
        related_name="finance_incomes",
        verbose_name="Tiền tệ",
        help_text="Tiền tệ của số gốc.",
        db_comment="Tiền tệ",
    )
    original_amount = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name="Số gốc",
        help_text="Số tiền theo tiền tệ; null khi không rõ.",
        db_comment="Số tiền gốc",
    )
    exchange_rate = models.DecimalField(
        max_digits=18,
        decimal_places=6,
        default=1,
        verbose_name="Tỷ giá",
        help_text="VNĐ cho 1 đơn vị.",
        db_comment="Tỷ giá",
    )
    rate_source = models.CharField(
        max_length=16,
        choices=RateSource.choices,
        default=RateSource.BASE,
        verbose_name="Nguồn tỷ giá",
        help_text="BASE / API / MANUAL / BANK_ACTUAL.",
        db_comment="Nguồn tỷ giá",
    )
    rate_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Ngày tỷ giá",
        help_text="Ngày của tỷ giá đã dùng.",
        db_comment="Ngày tỷ giá",
    )
    amount = models.DecimalField(
        max_digits=18,
        decimal_places=0,
        null=True,
        blank=True,
        verbose_name="Thực nhận (VNĐ)",
        help_text="VNĐ thực nhận; null khi không rõ.",
        db_comment="VNĐ thực nhận",
    )
    amount_status = models.CharField(
        max_length=16,
        choices=AmountStatus.choices,
        default=AmountStatus.OK,
        verbose_name="Trạng thái số tiền",
        help_text="OK / UNKNOWN.",
        db_comment="Trạng thái số tiền",
    )
    # ---- nền tảng
    platform = models.ForeignKey(
        "finance.Platform",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="incomes",
        verbose_name="Nền tảng",
        help_text="Null = chưa nhận diện.",
        db_comment="Nền tảng",
    )
    matched_rule = models.ForeignKey(
        "finance.ClassificationRule",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="incomes",
        verbose_name="Quy tắc khớp",
        help_text="Quy tắc đã nhận diện.",
        db_comment="Quy tắc khớp",
    )
    is_platform_locked = models.BooleanField(
        default=False,
        verbose_name="Khóa nền tảng",
        help_text="Người dùng tự chọn; nhận diện lại không đổi.",
        db_comment="Nền tảng do người dùng chọn",
    )
    # ---- khấu trừ (VNĐ)
    tax_withheld = models.BooleanField(
        default=False,
        verbose_name="Đã khấu trừ",
        help_text="Đã bị khấu trừ thuế (chụp).",
        db_comment="Đã bị khấu trừ thuế",
    )
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name="% khấu trừ",
        help_text="% đã bị khấu trừ (chụp).",
        db_comment="Phần trăm khấu trừ",
    )
    tax_amount = models.DecimalField(
        max_digits=18,
        decimal_places=0,
        null=True,
        blank=True,
        verbose_name="Tiền thuế bị khấu trừ",
        help_text="VNĐ.",
        db_comment="Tiền thuế bị khấu trừ",
    )
    gross_amount = models.DecimalField(
        max_digits=18,
        decimal_places=0,
        null=True,
        blank=True,
        verbose_name="Trước khấu trừ",
        help_text="amount + tax_amount.",
        db_comment="Thu nhập trước khấu trừ",
    )
    tax_rate_entry = models.ForeignKey(
        "finance.PlatformTaxRate",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="incomes",
        verbose_name="Mốc thuế",
        help_text="Mốc đã dùng.",
        db_comment="Mốc thuế đã dùng",
    )
    is_tax_manual = models.BooleanField(
        default=False,
        verbose_name="Thuế nhập tay",
        help_text="Không tự tính lại.",
        db_comment="Thuế nhập tay",
    )
    tax_status = models.CharField(
        max_length=16,
        choices=TaxStatus.choices,
        default=TaxStatus.UNCLASSIFIED,
        verbose_name="Trạng thái thuế",
        help_text="Trạng thái khấu trừ.",
        db_comment="Trạng thái thuế",
    )
    # ---- SePay
    sepay_id = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        verbose_name="Id SePay",
        help_text="Khóa chống trùng.",
        db_comment="Id giao dịch SePay",
    )
    reference_code = models.CharField(
        max_length=100,
        blank=True,
        default="",
        db_index=True,
        verbose_name="Mã giao dịch",
        help_text="Mã tham chiếu ngân hàng.",
        db_comment="Mã giao dịch ngân hàng",
    )
    bank_name = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Ngân hàng",
        help_text="Hiển thị.",
        db_comment="Ngân hàng",
    )
    account_last4 = models.CharField(
        max_length=4,
        blank=True,
        default="",
        verbose_name="4 số cuối TK",
        help_text="Hiển thị.",
        db_comment="4 số cuối tài khoản",
    )
    sepay_payload = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Dữ liệu SePay",
        help_text="Payload gốc.",
        db_comment="Payload gốc SePay",
    )

    class Meta:
        db_table = "finance_income"
        verbose_name = "Thu nhập"
        verbose_name_plural = "Thu nhập"
        ordering = ("-received_at",)
        constraints = (
            models.UniqueConstraint(
                fields=("owner", "sepay_id"),
                condition=models.Q(sepay_id__isnull=False, deleted_at__isnull=True),
                name="uq_finance_income_owner_sepay",
            ),
        )
        indexes = (models.Index(fields=("owner", "received_date"), name="ix_finance_income_owner_date"),)

    def __str__(self) -> str:
        """Ngày + số tiền."""
        return f"{self.received_date} {self.amount}"
