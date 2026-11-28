"""Model PageFeedback lưu góp ý / báo lỗi ẩn danh trên Custom Page và ShortLink."""

from django.conf import settings
from django.db import models
from django.db.models import Q

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class PageFeedback(JournalTracker, CoreModel):
    """Góp ý / báo lỗi ẩn danh của khách gửi tới Custom Page hoặc ShortLink."""

    class TargetType(models.TextChoices):
        """Loại đối tượng bị góp ý."""

        PAGE = "PAGE", "Trang tùy chỉnh"
        SHORT_LINK = "SHORT_LINK", "Liên kết rút gọn"

    class FeedbackType(models.TextChoices):
        """Phân loại góp ý / lỗi."""

        BROKEN_LINK = "BROKEN_LINK", "Sai link / Link hỏng"
        WRONG_INFO = "WRONG_INFO", "Sai thông tin"
        BUG = "BUG", "Lỗi hiển thị"
        SUGGESTION = "SUGGESTION", "Góp ý cải thiện"
        OTHER = "OTHER", "Khác"

    class Status(models.TextChoices):
        """Trạng thái xử lý góp ý."""

        OPEN = "OPEN", "Mới gửi"
        IN_PROGRESS = "IN_PROGRESS", "Đang kiểm tra"
        RESOLVED = "RESOLVED", "Đã xử lý"
        IGNORED = "IGNORED", "Bỏ qua"

    target_type = models.CharField(
        max_length=20,
        choices=TargetType.choices,
        verbose_name="Loại đối tượng",
        help_text="Trang tùy chỉnh hoặc Liên kết rút gọn.",
        db_comment="Loại đối tượng góp ý",
    )
    page = models.ForeignKey(
        "utilities.Page",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="feedbacks",
        verbose_name="Trang tùy chỉnh",
        db_comment="ID trang tùy chỉnh nếu có",
    )
    short_link = models.ForeignKey(
        "utilities.ShortLink",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="feedbacks",
        verbose_name="Liên kết rút gọn",
        db_comment="ID liên kết rút gọn nếu có",
    )
    target_owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_page_feedbacks",
        verbose_name="Chủ sở hữu",
        help_text="Chủ sở hữu trang/link nhận thông báo và xử lý góp ý.",
        db_comment="Chủ sở hữu trang/link",
    )
    target_url = models.URLField(
        max_length=2048,
        verbose_name="URL mục tiêu",
        help_text="Đường dẫn công khai nơi khách gửi góp ý.",
        db_comment="URL công khai bị báo lỗi",
    )
    target_title = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="Tên đối tượng",
        help_text="Tên trang, liên kết hoặc sản phẩm bị báo lỗi.",
        db_comment="Tiêu đề đối tượng góp ý",
    )
    target_item_id = models.CharField(
        max_length=64,
        blank=True,
        default="",
        verbose_name="Mã sản phẩm",
        help_text="ID sản phẩm trên trang Affiliate (nếu khách chọn mục cụ thể).",
        db_comment="ID mục sản phẩm affiliate",
    )
    feedback_type = models.CharField(
        max_length=30,
        choices=FeedbackType.choices,
        default=FeedbackType.BROKEN_LINK,
        verbose_name="Loại góp ý",
        db_comment="Phân loại góp ý/lỗi",
    )
    message = models.TextField(
        max_length=2000,
        verbose_name="Nội dung góp ý",
        db_comment="Nội dung mô tả lỗi/góp ý",
    )
    sender_name = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Tên người gửi",
        help_text="Tùy chọn; để trống hiển thị Ẩn danh.",
        db_comment="Tên người gửi góp ý",
    )
    sender_email = models.EmailField(
        blank=True,
        default="",
        verbose_name="Email người gửi",
        help_text="Tùy chọn; dùng để gửi email cảm ơn sau khi xử lý xong.",
        db_comment="Email người gửi để cảm ơn",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
        verbose_name="Trạng thái",
        db_comment="Trạng thái xử lý",
    )
    resolution_note = models.TextField(
        max_length=1000,
        blank=True,
        default="",
        verbose_name="Ghi chú xử lý",
        db_comment="Ghi chú cách xử lý của chủ trang",
    )
    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Thời điểm xử lý xong",
        db_comment="Mốc thời gian đánh dấu đã xử lý",
    )
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        verbose_name="Người xử lý",
        db_comment="Người xử lý góp ý",
    )
    thanked_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Thời điểm đã cảm ơn",
        db_comment="Mốc thời gian đã gửi email cảm ơn",
    )
    thanked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        verbose_name="Người gửi cảm ơn",
        db_comment="Người bấm gửi lời cảm ơn",
    )
    thank_template = models.ForeignKey(
        "system.EmailTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        verbose_name="Mẫu email cảm ơn",
        db_comment="ID mẫu email đã dùng để cảm ơn",
    )
    ip_hash = models.CharField(
        max_length=64,
        blank=True,
        default="",
        verbose_name="Mã băm IP",
        db_comment="HMAC IP người gửi để kiểm soát spam",
    )

    class Meta:
        """Cấu hình bảng và partial index tối ưu."""

        db_table = "utilities_page_feedback"
        ordering = ("-created_at", "-pk")
        indexes = [
            models.Index(
                fields=["target_owner", "status"],
                condition=Q(deleted_at__isnull=True),
                name="idx_page_fb_owner_status",
            ),
            models.Index(
                fields=["target_type", "created_at"],
                condition=Q(deleted_at__isnull=True),
                name="idx_page_fb_type_created",
            ),
        ]
        verbose_name = "Góp ý & Báo lỗi"
        verbose_name_plural = "Danh sách Góp ý & Báo lỗi"

    def __str__(self) -> str:
        """Hiển thị tóm tắt góp ý."""
        return f"[{self.target_type}] {self.target_title or self.target_url}"
