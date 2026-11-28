"""Model danh mục ngôn ngữ dùng chung cho toàn hệ thống (EmailTemplate, đa ngôn ngữ mở rộng...)."""

from django.db import models
from django.db.models import Q

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class Language(JournalTracker, CoreModel):
    """Ngôn ngữ được hỗ trợ trên hệ thống (mặc định có `vi`, `en`)."""

    code = models.CharField(
        max_length=16,
        verbose_name="Mã ngôn ngữ",
        help_text="Mã chuẩn IETF/ISO (vi, en, ja, ko, zh-hans...).",
        db_comment="Mã ngôn ngữ viết thường",
    )
    name = models.CharField(
        max_length=100,
        verbose_name="Tên ngôn ngữ",
        help_text="Tên bản địa hiển thị trên tab/bộ chọn (vd: Tiếng Việt, English, 日本語).",
        db_comment="Tên ngôn ngữ",
    )
    native_name = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Tên phụ",
        help_text="Tên tiếng Việt hoặc tên quốc tế bổ sung.",
        db_comment="Tên gọi bổ sung",
    )
    flag_emoji = models.CharField(
        max_length=16,
        blank=True,
        default="",
        verbose_name="Biểu tượng cờ",
        help_text="Emoji quốc kỳ hiển thị cạnh mã ngôn ngữ (vd: 🇻🇳, 🇺🇸, 🇯🇵).",
        db_comment="Emoji quốc kỳ",
    )
    is_default = models.BooleanField(
        default=False,
        verbose_name="Ngôn ngữ mặc định",
        help_text="Đánh dấu ngôn ngữ lõi của hệ thống (không thể xóa).",
        db_comment="Cờ ngôn ngữ mặc định",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Đang bật",
        help_text="Chỉ ngôn ngữ đang bật mới hiện thành tab trong các biểu mẫu đa ngôn ngữ.",
        db_comment="Trạng thái kích hoạt ngôn ngữ",
    )
    sort_order = models.PositiveIntegerField(
        default=0,
        verbose_name="Thứ tự hiển thị",
        help_text="Số nhỏ hiển thị trước.",
        db_comment="Thứ tự sắp xếp",
    )

    class Meta:
        """Cấu hình bảng, ràng buộc duy nhất `code` khi chưa xóa mềm."""

        db_table = "system_language"
        ordering = ("sort_order", "code")
        constraints = [
            models.UniqueConstraint(
                fields=["code"],
                condition=Q(deleted_at__isnull=True),
                name="uniq_system_language_code",
            ),
        ]
        verbose_name = "Ngôn ngữ"
        verbose_name_plural = "Danh sách Ngôn ngữ"

    def __str__(self) -> str:
        """Chuỗi đại diện gồm mã và tên ngôn ngữ."""
        return f"{self.code} — {self.name}"
