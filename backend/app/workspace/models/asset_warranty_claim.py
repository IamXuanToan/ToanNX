"""Model Phiếu Bảo hành & Sửa chữa cho thiết bị."""

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import Q

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class AssetWarrantyClaim(JournalTracker, CoreModel):
    """Lưu lịch sử gửi bảo hành hoặc sửa ngoài của từng thiết bị."""

    journal_fields = (
        "claim_code",
        "claim_type",
        "status",
        "submitted_date",
        "estimated_return_date",
        "returned_date",
        "service_center",
        "is_covered_by_warranty",
        "cost_vnd",
    )

    class ClaimType(models.TextChoices):
        """Loại phiếu xử lý thiết bị."""

        WARRANTY = "WARRANTY", "Bảo hành"
        PAID_REPAIR = "PAID_REPAIR", "Sửa chữa tính phí"
        MAINTENANCE = "MAINTENANCE", "Bảo trì / Vệ sinh"

    class Status(models.TextChoices):
        """Trạng thái phiếu bảo hành/sửa chữa."""

        SUBMITTED = "SUBMITTED", "Đã gửi máy"
        INSPECTING = "INSPECTING", "Đang kiểm tra"
        WAITING_PARTS = "WAITING_PARTS", "Chờ linh kiện"
        COMPLETED = "COMPLETED", "Đã hoàn tất"
        REJECTED = "REJECTED", "Từ chối BH"
        CANCELLED = "CANCELLED", "Đã hủy"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_warranty_claims",
        verbose_name="Chủ sở hữu",
        help_text="Chủ sở hữu phiếu bảo hành.",
        db_comment="Chủ sở hữu phiếu",
    )
    asset = models.ForeignKey(
        "workspace.Asset",
        on_delete=models.CASCADE,
        related_name="warranty_claims",
        verbose_name="Thiết bị",
        help_text="Thiết bị được gửi bảo hành/sửa chữa.",
        db_comment="Thiết bị liên quan",
    )
    claim_code = models.CharField(
        max_length=32,
        verbose_name="Mã phiếu",
        help_text="Mã phiếu nội bộ (tự sinh BH-YYYYMM-NNN nếu để trống).",
        db_comment="Mã phiếu bảo hành",
    )
    claim_type = models.CharField(
        max_length=20,
        choices=ClaimType.choices,
        default=ClaimType.WARRANTY,
        verbose_name="Loại phiếu",
        help_text="Bảo hành, sửa tính phí hoặc bảo trì.",
        db_comment="Loại phiếu",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SUBMITTED,
        verbose_name="Trạng thái",
        help_text="Tiến độ xử lý tại trung tâm.",
        db_comment="Trạng thái phiếu",
    )
    submitted_date = models.DateField(
        verbose_name="Ngày gửi",
        help_text="Ngày bàn giao thiết bị đi bảo hành/sửa chữa.",
        db_comment="Ngày gửi thiết bị",
    )
    estimated_return_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Ngày hẹn trả",
        help_text="Ngày trung tâm hẹn nhận lại thiết bị.",
        db_comment="Ngày hẹn trả máy",
    )
    returned_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Ngày nhận lại",
        help_text="Ngày thực tế nhận lại thiết bị.",
        db_comment="Ngày nhận lại máy",
    )
    service_center = models.CharField(
        max_length=200,
        verbose_name="TTBH / Nơi sửa",
        help_text="Tên trung tâm bảo hành hoặc cửa hàng sửa chữa.",
        db_comment="Trung tâm bảo hành",
    )
    service_center_address = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Địa chỉ TTBH",
        help_text="Địa chỉ tiếp nhận bảo hành.",
        db_comment="Địa chỉ TTBH",
    )
    service_center_contact = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Liên hệ TTBH",
        help_text="Hotline hoặc nhân viên tiếp nhận.",
        db_comment="Liên hệ TTBH",
    )
    external_ticket_code = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Mã biên nhận hãng/cửa hàng",
        help_text="Số phiếu do TTBH/cửa hàng cấp.",
        db_comment="Mã biên nhận bên ngoài",
    )
    issue_description = models.TextField(
        verbose_name="Mô tả lỗi",
        help_text="Triệu chứng hoặc yêu cầu kiểm tra.",
        db_comment="Mô tả lỗi ban đầu",
    )
    resolution_notes = models.TextField(
        blank=True,
        default="",
        verbose_name="Kết quả xử lý",
        help_text="Ghi chú linh kiện thay thế hoặc hướng khắc phục.",
        db_comment="Kết quả xử lý",
    )
    is_covered_by_warranty = models.BooleanField(
        default=True,
        verbose_name="Miễn phí theo BH",
        help_text="Được bảo hành miễn phí hay tự trả phí.",
        db_comment="Miễn phí theo bảo hành",
    )
    cost = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=Decimal("0"),
        verbose_name="Chi phí phát sinh",
        help_text="Số tiền phát sinh theo nguyên tệ.",
        db_comment="Chi phí nguyên tệ",
    )
    currency = models.ForeignKey(
        "system.Currency",
        on_delete=models.PROTECT,
        related_name="workspace_warranty_claims",
        verbose_name="Tiền tệ",
        help_text="Đơn vị tiền tệ của chi phí.",
        db_comment="Tiền tệ chi phí",
    )
    exchange_rate = models.DecimalField(
        max_digits=18,
        decimal_places=6,
        default=Decimal("1"),
        verbose_name="Tỷ giá quy đổi",
        help_text="Tỷ giá sang VNĐ.",
        db_comment="Tỷ giá quy đổi",
    )
    cost_vnd = models.DecimalField(
        max_digits=18,
        decimal_places=0,
        default=Decimal("0"),
        verbose_name="Chi phí VNĐ",
        help_text="Chi phí quy đổi ra VNĐ.",
        db_comment="Chi phí VNĐ",
    )
    part_warranty_months = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="BH linh kiện mới (tháng)",
        help_text="Số tháng bảo hành phần linh kiện vừa thay/sửa.",
        db_comment="Số tháng bảo hành linh kiện",
    )
    part_warranty_end_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Hạn BH linh kiện mới",
        help_text="Ngày hết hạn bảo hành phần linh kiện mới.",
        db_comment="Ngày hết hạn BH linh kiện",
    )
    attachments = models.ManyToManyField(
        "system.Attachment",
        blank=True,
        related_name="workspace_warranty_claims",
        verbose_name="Biên nhận / Hóa đơn sửa chữa",
        help_text="Các tệp chứng từ riêng tư của phiếu.",
    )

    class Meta:
        db_table = "workspace_asset_warranty_claim"
        constraints = (
            models.UniqueConstraint(
                fields=("owner", "claim_code"),
                condition=Q(deleted_at__isnull=True),
                name="uq_workspace_claim_owner_code",
            ),
        )
        indexes = (
            models.Index(
                fields=("owner", "status"),
                condition=Q(deleted_at__isnull=True),
                name="idx_ws_claim_owner_status",
            ),
        )
        verbose_name = "Phiếu bảo hành"
        verbose_name_plural = "Phiếu bảo hành"

    def __str__(self) -> str:
        """Mã phiếu bảo hành."""
        return self.claim_code
