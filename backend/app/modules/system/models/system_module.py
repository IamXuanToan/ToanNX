"""Trạng thái runtime của module đã cài đặt."""

from django.db import models

from app.core.models.core_model import CoreModel


class SystemModule(CoreModel):
    """Cấu hình runtime của một module: bật/tắt và icon.

    Chỉ có ý nghĩa với module đã cài (có trong registry). Tắt module không xóa dữ
    liệu, không xóa migration và không đổi INSTALLED_APPS.
    """

    code = models.CharField(
        max_length=32,
        unique=True,
        verbose_name="Mã module",
        db_comment="Mã module trong registry",
        help_text="Mã module trong registry, ví dụ `iam`.",
    )
    enabled = models.BooleanField(
        default=True,
        verbose_name="Đang bật",
        help_text="Module tắt sẽ từ chối các API của nó (MODULE_DISABLED).",
        db_comment="Module đang bật",
    )

    icon = models.CharField(
        max_length=64,
        blank=True,
        default="",
        verbose_name="Icon lucide",
        db_comment="Tên icon lucide-react (kebab-case); rỗng = icon mặc định của module",
        help_text="Tên icon lucide-react dạng kebab-case, ví dụ `shield-check`; để trống dùng icon mặc định.",
    )
    icon_attachment = models.ForeignKey(
        "attachment.Attachment",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Icon SVG",
        db_comment="File SVG tự upload; ưu tiên hơn icon lucide",
        help_text="File SVG đã upload qua module attachment; nếu có thì được dùng thay icon lucide.",
    )

    class Meta:
        db_table = "system_module"
        verbose_name = "Cấu hình module"
        verbose_name_plural = "Cấu hình module"

    def __str__(self) -> str:
        """Biểu diễn bằng mã."""
        return self.code
