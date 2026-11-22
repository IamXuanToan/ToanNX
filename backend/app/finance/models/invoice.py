"""Hóa đơn / chứng từ: bằng chứng thu nhập và thuế đã bị khấu trừ, dùng đối chiếu khi quyết toán."""

from django.conf import settings
from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker
from app.finance.constants.finance_choices import RateSource


class Invoice(JournalTracker, CoreModel):
    """Không ảnh hưởng số báo cáo; chỉ đối chiếu với các giao dịch gắn kèm."""

    class DocType(models.TextChoices):
        """Loại chứng từ."""

        WITHHOLDING_CERTIFICATE = "WITHHOLDING_CERTIFICATE", "Chứng từ khấu trừ thuế"
        INVOICE = "INVOICE", "Hóa đơn / invoice"
        STATEMENT = "STATEMENT", "Sao kê / bảng thanh toán"
        CONTRACT = "CONTRACT", "Hợp đồng"
        OTHER = "OTHER", "Khác"

    journal_fields = (
        "doc_type",
        "number",
        "issuer",
        "issued_on",
        "original_amount",
        "amount",
        "tax_amount",
        "note",
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="finance_invoices",
        verbose_name="Chủ",
        help_text="Người dùng sở hữu.",
        db_comment="Chủ",
    )
    doc_type = models.CharField(
        max_length=32,
        choices=DocType.choices,
        verbose_name="Loại",
        help_text="Loại chứng từ.",
        db_comment="Loại chứng từ",
    )
    number = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Số",
        help_text="Số hóa đơn/chứng từ.",
        db_comment="Số chứng từ",
    )
    issuer = models.CharField(
        max_length=255, verbose_name="Bên phát hành", help_text="Bên phát hành.", db_comment="Bên phát hành"
    )
    issuer_tax_code = models.CharField(
        max_length=50,
        blank=True,
        default="",
        verbose_name="MST bên phát hành",
        help_text="Mã số thuế.",
        db_comment="Mã số thuế bên phát hành",
    )
    issued_on = models.DateField(verbose_name="Ngày lập", help_text="Ngày lập.", db_comment="Ngày lập")
    period_from = models.DateField(
        null=True, blank=True, verbose_name="Kỳ từ", help_text="Kỳ thu nhập từ.", db_comment="Kỳ từ"
    )
    period_to = models.DateField(
        null=True, blank=True, verbose_name="Kỳ đến", help_text="Kỳ thu nhập đến.", db_comment="Kỳ đến"
    )
    platform = models.ForeignKey(
        "finance.Platform",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="invoices",
        verbose_name="Nền tảng",
        help_text="Nền tảng.",
        db_comment="Nền tảng",
    )
    currency = models.ForeignKey(
        "system.Currency",
        on_delete=models.PROTECT,
        related_name="finance_invoices",
        verbose_name="Tiền tệ",
        help_text="Tiền tệ trên chứng từ.",
        db_comment="Tiền tệ",
    )
    original_amount = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        verbose_name="Tổng tiền",
        help_text="Theo tiền tệ chứng từ.",
        db_comment="Tổng tiền gốc",
    )
    original_tax_amount = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name="Tiền thuế",
        help_text="Thuế đã khấu trừ ghi trên chứng từ.",
        db_comment="Tiền thuế gốc",
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
        help_text="BASE / API / MANUAL.",
        db_comment="Nguồn tỷ giá",
    )
    rate_date = models.DateField(
        null=True, blank=True, verbose_name="Ngày tỷ giá", help_text="Ngày tỷ giá.", db_comment="Ngày tỷ giá"
    )
    amount = models.DecimalField(
        max_digits=18,
        decimal_places=0,
        verbose_name="Tổng tiền (VNĐ)",
        help_text="Quy VNĐ.",
        db_comment="Tổng tiền VNĐ",
    )
    tax_amount = models.DecimalField(
        max_digits=18,
        decimal_places=0,
        null=True,
        blank=True,
        verbose_name="Tiền thuế (VNĐ)",
        help_text="Quy VNĐ.",
        db_comment="Tiền thuế VNĐ",
    )
    attachments = models.ManyToManyField(
        "system.Attachment",
        related_name="finance_invoices",
        verbose_name="File",
        help_text="File chứng từ (private).",
    )
    incomes = models.ManyToManyField(
        "finance.Income",
        blank=True,
        related_name="invoices",
        verbose_name="Giao dịch",
        help_text="Giao dịch liên quan.",
    )
    note = models.TextField(
        blank=True, default="", verbose_name="Ghi chú", help_text="Ghi chú.", db_comment="Ghi chú"
    )

    class Meta:
        db_table = "finance_invoice"
        verbose_name = "Hóa đơn / chứng từ"
        verbose_name_plural = "Hóa đơn / chứng từ"
        ordering = ("-issued_on", "-created_at")

    def __str__(self) -> str:
        """Loại + số."""
        return f"{self.get_doc_type_display()} {self.number}".strip()
