"""Block nội dung của trang tùy chỉnh."""

from django.db import models
from django.db.models import Q

from app.core.models.core_model import CoreModel


class PageBlock(CoreModel):
    """Block có kiểu rõ ràng, content được service kiểm tra theo kiểu."""

    class Type(models.TextChoices):
        """Các block phase đầu."""

        HEADING = "HEADING", "Tiêu đề"
        TEXT = "TEXT", "Văn bản"
        IMAGE = "IMAGE", "Ảnh"
        BUTTON = "BUTTON", "Nút"
        LINK_LIST = "LINK_LIST", "Danh sách liên kết"
        DIVIDER = "DIVIDER", "Phân cách"
        SOCIAL_LINKS = "SOCIAL_LINKS", "Mạng xã hội"
        QR_CODE = "QR_CODE", "Mã QR"

    page = models.ForeignKey(
        "custom_pages.Page",
        on_delete=models.CASCADE,
        related_name="blocks",
        verbose_name="Trang",
        help_text="Trang sở hữu block.",
        db_comment="Trang của block",
    )
    block_type = models.CharField(
        max_length=24,
        choices=Type.choices,
        verbose_name="Loại block",
        help_text="Loại nội dung được hỗ trợ.",
        db_comment="Loại block",
    )
    content = models.JSONField(
        verbose_name="Nội dung",
        help_text="Payload theo block_type, không chứa HTML tùy ý.",
        db_comment="Nội dung block",
    )
    position = models.PositiveSmallIntegerField(
        verbose_name="Thứ tự", help_text="Vị trí trong trang, bắt đầu từ 0.", db_comment="Thứ tự block"
    )
    is_visible = models.BooleanField(
        default=True,
        verbose_name="Hiển thị",
        help_text="False để ẩn block trên trang công khai.",
        db_comment="Cờ hiển thị block",
    )

    class Meta:
        db_table = "custom_page_block"
        verbose_name = "Block trang"
        verbose_name_plural = "Block trang"
        constraints = [
            models.UniqueConstraint(
                fields=["page", "position"],
                condition=Q(deleted_at__isnull=True),
                name="page_block_position_unique",
            )
        ]
        indexes = [models.Index(fields=["page", "position"], name="cpb_page_position_idx")]
