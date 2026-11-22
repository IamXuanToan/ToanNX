"""Model lưu trữ tham số cấu hình hệ thống dạng key-value."""

from django.db import models

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class Setting(JournalTracker, CoreModel):
    """Cấu hình hệ thống dạng key-value.

    Cho phép quản trị viên cấu hình các tính năng linh hoạt (như bật/tắt đăng nhập mạng xã hội,
    bật/tắt đăng ký, thông số nghiệp vụ) mà không cần deploy lại code.
    """

    key = models.CharField(
        max_length=100,
        verbose_name="Khóa cấu hình",
        db_comment="Khóa định danh cấu hình (chữ thường, gạch dưới)",
        help_text="Định danh duy nhất của cấu hình (vd: auth_google_enabled).",
    )
    value = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Giá trị cấu hình",
        db_comment="Giá trị cấu hình (JSON: boolean, string, number, dict, list)",
        help_text="Nội dung giá trị cấu hình được lưu dưới định dạng JSON linh hoạt.",
    )
    description = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Mô tả",
        db_comment="Mô tả ý nghĩa của cấu hình",
        help_text="Giải thích mục đích và tác động của cấu hình.",
    )
    category = models.CharField(
        max_length=50,
        default="general",
        verbose_name="Nhóm cấu hình",
        db_comment="Nhóm cấu hình (vd: general, auth, storage)",
        help_text="Phân loại cấu hình để hiển thị theo nhóm.",
    )
    is_public = models.BooleanField(
        default=False,
        verbose_name="Công khai",
        db_comment="Cho phép đọc công khai không cần đăng nhập",
        help_text="Bật để cho phép client chưa đăng nhập đọc giá trị này (vd: danh sách SSO khả dụng).",
    )

    class Meta:
        verbose_name = "Cấu hình hệ thống"
        verbose_name_plural = "Cấu hình hệ thống"
        constraints = [
            models.UniqueConstraint(
                fields=["key"],
                condition=models.Q(deleted_at__isnull=True),
                name="uq_system_setting_key_alive",
            ),
        ]
        indexes = [
            models.Index(fields=["category"], name="idx_system_setting_category"),
            models.Index(fields=["is_public"], name="idx_system_setting_is_public"),
        ]

    def __str__(self) -> str:
        return f"{self.key}: {self.value}"
