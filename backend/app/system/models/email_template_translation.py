"""Bảng mapping bản dịch đa ngôn ngữ giữa `EmailTemplate` và `Language`."""

from django.db import models
from django.db.models import Q

from app.core.models.core_model import CoreModel
from app.system.models.email_template import EmailTemplate
from app.system.models.language import Language


class EmailTemplateTranslation(CoreModel):
    """Lưu nội dung từng ngôn ngữ của một `EmailTemplate`, liên kết khóa ngoại tới `Language`."""

    template = models.ForeignKey(
        EmailTemplate,
        on_delete=models.CASCADE,
        related_name="translation_items",
        verbose_name="Mẫu email",
        db_comment="Khóa ngoại tới EmailTemplate",
    )
    language = models.ForeignKey(
        Language,
        on_delete=models.PROTECT,
        related_name="email_template_translations",
        verbose_name="Ngôn ngữ",
        db_comment="Khóa ngoại tới Language",
    )
    name = models.CharField(
        max_length=150,
        verbose_name="Tên mẫu theo ngôn ngữ",
        db_comment="Tên mẫu theo ngôn ngữ",
    )
    subject = models.CharField(
        max_length=200,
        verbose_name="Tiêu đề email",
        db_comment="Tiêu đề email theo ngôn ngữ",
    )
    content = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Nội dung Tiptap JSON",
        db_comment="Nội dung Tiptap JSON theo ngôn ngữ",
    )
    html_body = models.TextField(
        blank=True,
        default="",
        verbose_name="Nội dung HTML sạch",
        db_comment="HTML nội dung theo ngôn ngữ",
    )

    class Meta:
        """Ràng buộc duy nhất mỗi cặp `(template, language)` chưa xóa mềm."""

        db_table = "system_email_template_translation"
        ordering = ("language__sort_order", "language__code")
        constraints = [
            models.UniqueConstraint(
                fields=["template", "language"],
                condition=Q(deleted_at__isnull=True),
                name="uniq_email_tpl_trans_tpl_lang",
            ),
        ]
        verbose_name = "Bản dịch mẫu email"
        verbose_name_plural = "Danh sách Bản dịch mẫu email"

    def __str__(self) -> str:
        """Tên mẫu kèm mã ngôn ngữ."""
        return f"{self.template.code} [{self.language.code}]"
