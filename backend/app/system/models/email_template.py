"""Model EmailTemplate lưu mẫu email Tiptap + trường trộn theo phạm vi hệ thống/cá nhân."""

from django.conf import settings
from django.db import models
from django.db.models import Q

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class EmailTemplate(JournalTracker, CoreModel):
    """Mẫu email lưu Tiptap JSON + HTML sạch, hỗ trợ trường trộn `{{variable}}`."""

    class Scope(models.TextChoices):
        """Phạm vi sử dụng của mẫu email."""

        SYSTEM = "SYSTEM", "Toàn hệ thống"
        PERSONAL = "PERSONAL", "Cá nhân"

    class Status(models.TextChoices):
        """Trạng thái hoạt động của mẫu email."""

        ACTIVE = "ACTIVE", "Đang dùng"
        DRAFT = "DRAFT", "Nháp"
        ARCHIVED = "ARCHIVED", "Lưu trữ"

    class Category(models.TextChoices):
        """Phân nhóm mục đích sử dụng mẫu email."""

        AUTH = "AUTH", "Xác thực hệ thống"
        FEEDBACK_THANKS = "FEEDBACK_THANKS", "Cảm ơn góp ý"
        NOTIFICATION = "NOTIFICATION", "Thông báo"
        CUSTOM = "CUSTOM", "Tùy chỉnh"

    code = models.CharField(
        max_length=80,
        verbose_name="Mã mẫu",
        help_text="Mã định danh mẫu email (vd: feedback_thank_you, email_verification).",
        db_comment="Mã slug nhận diện mẫu email",
    )
    name = models.CharField(
        max_length=150,
        verbose_name="Tên mẫu",
        help_text="Tên hiển thị của mẫu email.",
        db_comment="Tên hiển thị mẫu email",
    )
    description = models.CharField(
        max_length=300,
        blank=True,
        default="",
        verbose_name="Mô tả",
        help_text="Ghi chú ngắn về ngữ cảnh dùng mẫu email.",
        db_comment="Mô tả mẫu email",
    )
    locale = models.CharField(
        max_length=10,
        default="vi",
        verbose_name="Ngôn ngữ",
        help_text="Ngôn ngữ mẫu email (vi hoặc en).",
        db_comment="Ngôn ngữ mẫu email",
    )
    scope = models.CharField(
        max_length=20,
        choices=Scope.choices,
        default=Scope.PERSONAL,
        verbose_name="Phạm vi",
        help_text="SYSTEM dùng chung toàn hệ thống; PERSONAL chỉ thuộc người tạo.",
        db_comment="Phạm vi mẫu email",
    )
    category = models.CharField(
        max_length=30,
        choices=Category.choices,
        default=Category.CUSTOM,
        verbose_name="Nhóm mẫu",
        help_text="Nhóm mục đích gửi email.",
        db_comment="Phân loại mẫu email",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name="Trạng thái",
        help_text="ACTIVE mới được dùng để gửi; DRAFT là nháp; ARCHIVED đã lưu trữ.",
        db_comment="Trạng thái mẫu email",
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="email_templates",
        verbose_name="Chủ sở hữu",
        help_text="Để trống khi scope=SYSTEM; là tài khoản tạo khi scope=PERSONAL.",
        db_comment="Chủ sở hữu mẫu email cá nhân",
    )
    subject = models.CharField(
        max_length=200,
        verbose_name="Tiêu đề email",
        help_text="Tiêu đề thư, có thể chứa trường trộn {{variable}}.",
        db_comment="Tiêu đề email",
    )
    content = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Nội dung Tiptap JSON",
        help_text="Cấu trúc tài liệu Tiptap JSON để chỉnh sửa trên trình soạn thảo.",
        db_comment="Nội dung Tiptap JSON",
    )
    html_body = models.TextField(
        blank=True,
        default="",
        verbose_name="Nội dung HTML sạch",
        help_text="HTML đã làm sạch sinh từ Tiptap để trộn biến và gửi email.",
        db_comment="HTML nội dung email",
    )
    translations = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Bản dịch theo ngôn ngữ",
        help_text="Từ điển {locale: {name, subject, content, html_body}} cho đa ngôn ngữ trên cùng 1 mẫu.",
        db_comment="Bản dịch đa ngôn ngữ của mẫu email",
    )
    variables = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Danh sách trường trộn",
        help_text="Danh sách metadata biến trộn gợi ý [{key, label, example}].",
        db_comment="Metadata biến trộn",
    )
    is_system_default = models.BooleanField(
        default=False,
        verbose_name="Mẫu mặc định hệ thống",
        help_text="Đánh dấu mẫu mặc định được seed tự động.",
        db_comment="Cờ mẫu mặc định hệ thống",
    )

    class Meta:
        """Cấu hình bảng, ràng buộc duy nhất và chỉ mục tối ưu."""

        db_table = "system_email_template"
        ordering = ("-is_system_default", "-updated_at", "-pk")
        constraints = [
            models.UniqueConstraint(
                fields=["code"],
                condition=Q(deleted_at__isnull=True, scope="SYSTEM"),
                name="uniq_system_email_tpl_code",
            ),
            models.UniqueConstraint(
                fields=["owner", "code"],
                condition=Q(deleted_at__isnull=True, scope="PERSONAL"),
                name="uniq_personal_email_tpl_owner_code",
            ),
        ]
        indexes = [
            models.Index(
                fields=["owner", "status"],
                condition=Q(deleted_at__isnull=True),
                name="idx_email_tpl_owner_status",
            ),
            models.Index(
                fields=["scope", "category", "status"],
                condition=Q(deleted_at__isnull=True),
                name="idx_email_tpl_scope_cat_st",
            ),
        ]
        verbose_name = "Mẫu Email"
        verbose_name_plural = "Danh sách Mẫu Email"

    def __str__(self) -> str:
        """Tên hiển thị kèm scope và ngôn ngữ."""
        return f"{self.name} [{self.scope}/{self.locale}]"
