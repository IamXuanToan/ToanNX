"""Model file đã upload."""

import uuid
from pathlib import PurePath
from typing import Any

from django.db import models
from django.utils import timezone

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


def attachment_upload_path(instance: Any, filename: str) -> str:
    """Đường dẫn lưu: `attachments/YYYY/MM/<uuid><ext>` (không dùng tên gốc trong path).

    Args:
        instance: Attachment.
        filename: Tên file gốc.

    Returns:
        Đường dẫn tương đối trong storage.
    """
    now = timezone.now()
    suffix = PurePath(filename).suffix.lower()[:10]
    return f"attachments/{now:%Y/%m}/{uuid.uuid4().hex}{suffix}"


class Attachment(JournalTracker, CoreModel):
    """File lưu trên storage mặc định (local khi dev; object storage khi production).

    Người upload là `created_by`. Xóa mềm; file vật lý được `purge_deleted_files` dọn sau
    `ATTACHMENT_PURGE_DAYS` ngày (giữ dòng dữ liệu, đánh dấu `purged_at`).
    """

    journal_fields = ("original_name", "folder")

    folder = models.ForeignKey(
        "attachment.AttachmentFolder",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="files",
        verbose_name="Thư mục",
        help_text="Nhóm logic của file; đổi nhóm không đổi đường dẫn hoặc URL.",
        db_comment="Thư mục logic, NULL là chưa phân loại",
    )
    file = models.FileField(
        upload_to=attachment_upload_path,
        max_length=255,
        verbose_name="File",
        db_comment="Đường dẫn file trong storage",
        help_text="File trong storage, đường dẫn `attachments/YYYY/MM/<uuid><ext>`.",
    )
    original_name = models.CharField(
        max_length=255,
        verbose_name="Tên file gốc",
        db_comment="Tên file người dùng upload",
        help_text="Tên file khi người dùng upload (chỉ để hiển thị).",
    )
    content_type = models.CharField(
        max_length=100,
        verbose_name="Kiểu nội dung",
        help_text="Kiểu xác định từ chữ ký file (không tin header của client).",
        db_comment="MIME type đã xác minh",
    )
    size = models.PositiveBigIntegerField(
        verbose_name="Dung lượng (byte)",
        db_comment="Dung lượng byte",
        help_text="Dung lượng file tính bằng byte.",
    )
    checksum = models.CharField(
        max_length=64,
        db_index=True,
        verbose_name="SHA-256",
        db_comment="SHA-256 nội dung file",
        help_text="SHA-256 của nội dung file, dùng phát hiện trùng lặp/toàn vẹn.",
    )
    purged_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Thời điểm dọn file",
        db_comment="Thời điểm file vật lý bị xóa khỏi storage",
        help_text="Khác NULL: file vật lý đã bị dọn (bản ghi đã xóa mềm quá hạn giữ).",
    )

    class Meta:
        db_table = "attachment"
        verbose_name = "File đính kèm"
        verbose_name_plural = "File đính kèm"

    def __str__(self) -> str:
        """Biểu diễn bằng tên gốc."""
        return self.original_name

    @property
    def is_image(self) -> bool:
        """File là ảnh."""
        return self.content_type.startswith("image/")
