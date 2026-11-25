"""Giao dịch quyên góp / ủng hộ nhận qua Webhook SePay."""

from django.conf import settings
from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class DonationTransaction(JournalTracker, CoreModel):
    """Giao dịch ủng hộ trên trang Donate (Page)."""

    class Tier(models.TextChoices):
        """Bậc vinh danh trên trang."""

        NORMAL = "NORMAL", "Bình thường"
        BRONZE = "BRONZE", "Bảng Đồng"
        SILVER = "SILVER", "Bảng Bạc"
        GOLD = "GOLD", "Bảng Vàng"
        DIAMOND = "DIAMOND", "Bảng Kim Cương"

    class GiftType(models.TextChoices):
        """Loại quà tặng quy đổi."""

        NOODLE = "NOODLE", "Gói mì tôm"
        COFFEE = "COFFEE", "Ly cà phê"
        BREAKFAST = "BREAKFAST", "Bữa sáng"
        BOOK = "BOOK", "Cuốn sách"
        HOTPOT = "HOTPOT", "Bữa lẩu"
        SPECIAL = "SPECIAL", "Món quà đặc biệt"
        CUSTOM = "CUSTOM", "Tùy chỉnh"

    page = models.ForeignKey(
        "utilities.Page",
        on_delete=models.CASCADE,
        related_name="donation_transactions",
        verbose_name="Trang ủng hộ",
        help_text="Trang tùy chỉnh nhận tiền.",
        db_comment="Trang tùy chỉnh nhận tiền",
    )
    qr_item_id = models.CharField(
        max_length=64,
        blank=True,
        default="",
        verbose_name="Mã phương thức QR",
        help_text="ID của mã QR trong cấu hình trang.",
        db_comment="ID mã QR trong trang",
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="donation_transactions",
        verbose_name="Chủ sở hữu",
        help_text="Người dùng sở hữu trang nhận ủng hộ.",
        db_comment="Người dùng sở hữu trang",
    )
    sepay_id = models.CharField(
        max_length=64,
        unique=True,
        verbose_name="Mã giao dịch SePay",
        help_text="Mã giao dịch chống trùng lặp từ SePay.",
        db_comment="Mã giao dịch SePay",
    )
    amount = models.PositiveBigIntegerField(
        verbose_name="Số tiền",
        help_text="Số tiền ủng hộ (VNĐ).",
        db_comment="Số tiền ủng hộ VNĐ",
    )
    donor_title = models.CharField(
        max_length=100,
        verbose_name="Danh xưng tri ân",
        help_text="Danh xưng hiển thị (Anh chị em đẹp zai xinh gái...).",
        db_comment="Danh xưng tri ân hiển thị",
    )
    message = models.TextField(
        blank=True,
        default="",
        verbose_name="Lời nhắn",
        help_text="Lời nhắn ủng hộ hiển thị ra công khai.",
        db_comment="Lời nhắn hiển thị",
    )
    original_content = models.TextField(
        blank=True,
        default="",
        verbose_name="Nội dung chuyển khoản gốc",
        help_text="Toàn bộ nội dung memo từ SePay.",
        db_comment="Nội dung memo gốc từ SePay",
    )
    gift_type = models.CharField(
        max_length=32,
        choices=GiftType.choices,
        default=GiftType.COFFEE,
        verbose_name="Loại quà tặng",
        help_text="Loại quà quy đổi theo số tiền.",
        db_comment="Loại quà tặng quy đổi",
    )
    gift_label = models.CharField(
        max_length=100,
        default="Ly cà phê",
        verbose_name="Nhãn quà tặng",
        help_text="Nhãn hiển thị món quà.",
        db_comment="Nhãn quà tặng hiển thị",
    )
    tier = models.CharField(
        max_length=20,
        choices=Tier.choices,
        default=Tier.NORMAL,
        verbose_name="Bậc vinh danh",
        help_text="Bậc xếp hạng trên Bảng Vinh danh.",
        db_comment="Bậc vinh danh",
    )
    tier_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Hết hạn vinh danh lúc",
        help_text="Thời điểm hết hạn đếm ngược trên Bảng vinh danh.",
        db_comment="Thời điểm hết hạn vinh danh",
    )
    is_hidden = models.BooleanField(
        default=False,
        verbose_name="Chủ trang ẩn",
        help_text="Chủ trang chủ động ẩn bình luận này khỏi trang công khai.",
        db_comment="Chủ trang ẩn bình luận",
    )
    is_censored = models.BooleanField(
        default=False,
        verbose_name="Hệ thống kiểm duyệt",
        help_text="Tự động đánh dấu khi nội dung chứa từ ngữ xấu/khủng bố/chửi tục.",
        db_comment="Tự động kiểm duyệt vi phạm từ ngữ",
    )
    received_at = models.DateTimeField(
        verbose_name="Thời gian nhận tiền",
        help_text="Thời gian giao dịch phát sinh từ ngân hàng.",
        db_comment="Thời gian giao dịch ngân hàng",
    )

    class Meta:
        db_table = "utilities_donation_transaction"
        verbose_name = "Giao dịch quyên góp"
        verbose_name_plural = "Giao dịch quyên góp"
        indexes = [
            models.Index(
                fields=["owner", "-created_at"],
                condition=models.Q(deleted_at__isnull=True),
                name="donate_owner_created_idx",
            ),
            models.Index(
                fields=["page", "-created_at"],
                condition=models.Q(deleted_at__isnull=True),
                name="donate_page_created_idx",
            ),
            models.Index(
                fields=["page", "tier", "-amount"],
                condition=models.Q(deleted_at__isnull=True, is_hidden=False, is_censored=False),
                name="donate_leaderboard_idx",
            ),
        ]

    def __str__(self) -> str:
        """Mô tả giao dịch."""
        return f"{self.donor_title} - {self.amount:,} ₫ ({self.page.title})"
